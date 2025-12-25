import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BRISE_API_BASE = "https://brisev2.agst.com.br:8090/api/v2";

interface BriseDevice {
  deviceId: string;
  name: string;
  model: string;
  isOnline: boolean;
  currentTemp?: number;
  targetTemp?: number;
  mode?: string;
  isOn?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { workspaceId } = await req.json();

    if (!workspaceId) {
      return new Response(
        JSON.stringify({ error: "workspaceId is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[brise-devices] Fetching devices for workspace: ${workspaceId}`);

    // Get BRISE config for this workspace
    const { data: config, error: configError } = await supabase
      .from('brise_config')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      console.error(`[brise-devices] No active config found`);
      return new Response(
        JSON.stringify({ error: "BRISE not configured for this workspace" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    if (config.token_expires_at && new Date(config.token_expires_at) < new Date()) {
      console.log(`[brise-devices] Token expired, attempting refresh`);
      // Token expired, try to refresh
      const refreshResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/brise-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({ action: 'refresh', workspaceId }),
      });

      if (!refreshResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Token expired, please re-authenticate" }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch updated config
      const { data: updatedConfig } = await supabase
        .from('brise_config')
        .select('access_token')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .single();

      if (updatedConfig) {
        config.access_token = updatedConfig.access_token;
      }
    }

    // Fetch devices from BRISE API
    const devicesResponse = await fetch(`${BRISE_API_BASE}/user_devices`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!devicesResponse.ok) {
      const errorText = await devicesResponse.text();
      console.error(`[brise-devices] Failed to fetch devices: ${devicesResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: "Failed to fetch devices from BRISE" }),
        { status: devicesResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const devicesData = await devicesResponse.json();
    console.log(`[brise-devices] Raw response:`, JSON.stringify(devicesData));

    // Get already imported devices
    const { data: existingEquipments } = await supabase
      .from('equipments')
      .select('brise_device_id')
      .eq('workspace_id', workspaceId)
      .not('brise_device_id', 'is', null);

    const importedDeviceIds = new Set(existingEquipments?.map(e => e.brise_device_id) || []);

    // Map BRISE devices to our format
    const devices: BriseDevice[] = (devicesData.devices || devicesData.user_devices || devicesData || []).map((device: any) => {
      const deviceId = device.id?.toString() || device.device_id?.toString() || device.deviceId?.toString();
      return {
        deviceId,
        name: device.name || device.device_name || `BRISE ${deviceId}`,
        model: device.model || device.device_model || 'BRISE AC',
        isOnline: device.online ?? device.is_online ?? true,
        currentTemp: device.current_temperature ?? device.currentTemp ?? device.ambient_temp,
        targetTemp: device.target_temperature ?? device.targetTemp ?? device.set_temp,
        mode: device.mode ?? device.operation_mode,
        isOn: device.is_on ?? device.power ?? device.status === 'on',
        isImported: importedDeviceIds.has(deviceId),
      };
    });

    console.log(`[brise-devices] Found ${devices.length} devices`);

    return new Response(
      JSON.stringify({ devices }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[brise-devices] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
