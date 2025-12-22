import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SMARTTHINGS_API = 'https://api.smartthings.com/v1';

interface Command {
  component?: string;
  capability: string;
  command: string;
  arguments?: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('SmartThings Control - No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with user's auth token to verify identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('SmartThings Control - Invalid authentication:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`SmartThings Control - Authenticated user: ${user.id}`);

    const { deviceId, action, value, workspaceId } = await req.json();
    
    console.log(`SmartThings Control - Device: ${deviceId}, Action: ${action}, Value: ${value}`);

    if (!workspaceId) {
      return new Response(
        JSON.stringify({ error: 'workspaceId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is workspace member
    const { data: isMember } = await supabase.rpc('is_workspace_member', {
      _user_id: user.id,
      _workspace_id: workspaceId
    });

    if (!isMember) {
      console.error('SmartThings Control - User not authorized for workspace');
      return new Response(
        JSON.stringify({ error: 'Not authorized for this workspace' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get SmartThings config for this workspace
    const { data: config, error: configError } = await supabase
      .from('smartthings_config')
      .select('personal_access_token')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: 'SmartThings não está configurado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = config.personal_access_token;
    let commands: Command[] = [];

    switch (action) {
      case 'turnOn':
        commands = [{
          capability: 'switch',
          command: 'on',
        }];
        break;

      case 'turnOff':
        commands = [{
          capability: 'switch',
          command: 'off',
        }];
        break;

      case 'setTemperature':
        commands = [{
          capability: 'thermostatCoolingSetpoint',
          command: 'setCoolingSetpoint',
          arguments: [value],
        }];
        break;

      case 'setMode':
        const modeMap: Record<string, string> = {
          'cool': 'cool',
          'heat': 'heat',
          'auto': 'auto',
          'fan': 'fanOnly',
        };
        commands = [{
          capability: 'airConditionerMode',
          command: 'setAirConditionerMode',
          arguments: [modeMap[value] || value],
        }];
        break;

      case 'setFanSpeed':
        commands = [{
          capability: 'airConditionerFanMode',
          command: 'setFanMode',
          arguments: [value],
        }];
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Ação não suportada' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Send commands to SmartThings
    const response = await fetch(`${SMARTTHINGS_API}/devices/${deviceId}/commands`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ commands }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('SmartThings Command Error:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao enviar comando' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log('Command sent successfully:', result);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SmartThings Control Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
