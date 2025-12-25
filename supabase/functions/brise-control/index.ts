import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BRISE_API_BASE = "https://brisev2.agst.com.br:8090/api/v2";

type BriseAction = 'turnOn' | 'turnOff' | 'setTemperature' | 'setMode';

interface ControlRequest {
  deviceId: string;
  action: BriseAction;
  value?: string | number;
  workspaceId: string;
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

    const { deviceId, action, value, workspaceId }: ControlRequest = await req.json();

    if (!deviceId || !action || !workspaceId) {
      return new Response(
        JSON.stringify({ error: "deviceId, action, and workspaceId are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[brise-control] Action: ${action} on device: ${deviceId}, value: ${value}`);

    // Get BRISE config for this workspace
    const { data: config, error: configError } = await supabase
      .from('brise_config')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      console.error(`[brise-control] No active config found`);
      return new Response(
        JSON.stringify({ error: "BRISE not configured for this workspace" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    if (config.token_expires_at && new Date(config.token_expires_at) < new Date()) {
      console.log(`[brise-control] Token expired`);
      return new Response(
        JSON.stringify({ error: "Token expired, please re-authenticate" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the command payload for BRISE API
    // BRISE uses the "agendas" endpoint for immediate commands
    let commandPayload: any = {
      device_id: parseInt(deviceId),
      immediate: true, // Execute immediately, not scheduled
    };

    switch (action) {
      case 'turnOn':
        commandPayload.power = true;
        commandPayload.status = 'on';
        break;
      case 'turnOff':
        commandPayload.power = false;
        commandPayload.status = 'off';
        break;
      case 'setTemperature':
        if (typeof value !== 'number') {
          return new Response(
            JSON.stringify({ error: "Temperature value must be a number" }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        commandPayload.set_temp = value;
        commandPayload.target_temperature = value;
        break;
      case 'setMode':
        if (typeof value !== 'string') {
          return new Response(
            JSON.stringify({ error: "Mode value must be a string" }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // Map our modes to BRISE modes
        const modeMap: Record<string, string> = {
          'cool': 'cool',
          'heat': 'heat',
          'fan': 'fan',
          'dry': 'dry',
          'auto': 'auto',
        };
        commandPayload.operation_mode = modeMap[value] || value;
        commandPayload.mode = modeMap[value] || value;
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`[brise-control] Sending command:`, JSON.stringify(commandPayload));

    // Send command to BRISE API
    const controlResponse = await fetch(`${BRISE_API_BASE}/agendas`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agenda: commandPayload }),
    });

    if (!controlResponse.ok) {
      const errorText = await controlResponse.text();
      console.error(`[brise-control] Command failed: ${controlResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: "Failed to send command to BRISE device", details: errorText }),
        { status: controlResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseData = await controlResponse.json();
    console.log(`[brise-control] Command response:`, JSON.stringify(responseData));

    // Update last_sync_at
    await supabase
      .from('brise_config')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', config.id);

    return new Response(
      JSON.stringify({ success: true, response: responseData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[brise-control] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
