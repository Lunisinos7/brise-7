import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BRISE_API_BASE = "https://brisev2.agst.com.br:8090/api/v2";

interface DeviceStatus {
  deviceId: string;
  isOn: boolean;
  currentTemp: number;
  targetTemp: number;
  mode: string;
  fanSpeed: string;
  isOnline: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { workspaceId, equipmentIds } = await req.json();

    if (!workspaceId) {
      return new Response(
        JSON.stringify({ error: "workspaceId is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[brise-status] Fetching status for workspace: ${workspaceId}`);

    // Get BRISE config for this workspace
    const { data: config, error: configError } = await supabase
      .from('brise_config')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      console.log(`[brise-status] No active BRISE config found`);
      return new Response(
        JSON.stringify({ error: "BRISE not configured", statuses: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    if (config.token_expires_at && new Date(config.token_expires_at) < new Date()) {
      console.log(`[brise-status] Token expired, attempting refresh`);
      const refreshResponse = await fetch(`${supabaseUrl}/functions/v1/brise-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({ action: 'refresh', workspaceId }),
      });

      if (!refreshResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Token expired", statuses: [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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

    // Get BRISE equipment from database
    let query = supabase
      .from('equipments')
      .select('id, brise_device_id, name')
      .eq('workspace_id', workspaceId)
      .eq('integration', 'BRISE')
      .not('brise_device_id', 'is', null);

    if (equipmentIds && equipmentIds.length > 0) {
      query = query.in('id', equipmentIds);
    }

    const { data: equipments, error: eqError } = await query;

    if (eqError || !equipments || equipments.length === 0) {
      console.log(`[brise-status] No BRISE equipment found`);
      return new Response(
        JSON.stringify({ statuses: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[brise-status] Found ${equipments.length} BRISE equipment(s)`);

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
      console.error(`[brise-status] Failed to fetch devices: ${devicesResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: "Failed to fetch status from BRISE", statuses: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const devicesData = await devicesResponse.json();
    const devices = devicesData.devices || devicesData.user_devices || devicesData || [];

    // Map fan speed values from BRISE API to our format (1-4)
    const mapFanSpeed = (speed: string | number | undefined): number => {
      if (typeof speed === 'number') return Math.min(4, Math.max(1, speed));
      if (!speed) return 2;
      const speedLower = speed.toString().toLowerCase();
      if (speedLower === 'low' || speedLower === 'baixa') return 1;
      if (speedLower === 'medium' || speedLower === 'média' || speedLower === 'media') return 2;
      if (speedLower === 'high' || speedLower === 'alta') return 3;
      if (speedLower === 'auto' || speedLower === 'automático') return 4;
      return 2;
    };

    // Create a map of device status by deviceId
    const deviceStatusMap = new Map<string, any>();
    for (const device of devices) {
      const deviceId = device.id?.toString() || device.device_id?.toString() || device.deviceId?.toString();
      if (deviceId) {
        deviceStatusMap.set(deviceId, device);
      }
    }

    // Build statuses for our equipment
    const statuses: DeviceStatus[] = [];
    const updates: { id: string; data: any }[] = [];

    for (const equipment of equipments) {
      const device = deviceStatusMap.get(equipment.brise_device_id);
      if (device) {
        const isOn = device.is_on ?? device.power ?? (device.status === 'on');
        const currentTemp = device.current_temperature ?? device.currentTemp ?? device.ambient_temp ?? 25;
        const targetTemp = device.target_temperature ?? device.targetTemp ?? device.set_temp ?? 22;
        const mode = (device.mode ?? device.operation_mode ?? 'cool').toLowerCase();
        const fanSpeedRaw = device.fan_speed ?? device.fanSpeed ?? device.fan ?? 'medium';
        const fanSpeed = mapFanSpeed(fanSpeedRaw);
        const isOnline = device.online ?? device.is_online ?? true;

        statuses.push({
          deviceId: equipment.id,
          isOn,
          currentTemp,
          targetTemp,
          mode,
          fanSpeed: fanSpeed.toString(),
          isOnline,
        });

        updates.push({
          id: equipment.id,
          data: {
            is_on: isOn,
            current_temp: currentTemp,
            target_temp: targetTemp,
            mode,
            last_synced_at: new Date().toISOString(),
          },
        });
      }
    }

    // Batch update equipment in database
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('equipments')
        .update(update.data)
        .eq('id', update.id);

      if (updateError) {
        console.error(`[brise-status] Failed to update equipment ${update.id}:`, updateError);
      }
    }

    console.log(`[brise-status] Updated ${updates.length} equipment(s)`);

    // Update last sync time in config
    await supabase
      .from('brise_config')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('workspace_id', workspaceId)
      .eq('is_active', true);

    return new Response(
      JSON.stringify({ statuses, updated: updates.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[brise-status] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, statuses: [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
