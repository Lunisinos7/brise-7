import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SMARTTHINGS_API = 'https://api.smartthings.com/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('SmartThings Sync - No authorization header');
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
      console.error('SmartThings Sync - Invalid authentication:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`SmartThings Sync - Authenticated user: ${user.id}`);

    const { equipmentId, workspaceId } = await req.json().catch(() => ({}));
    
    console.log('SmartThings Sync - Starting sync...');

    if (!workspaceId) {
      return new Response(
        JSON.stringify({ error: 'workspaceId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is workspace admin for sync operations
    const { data: isAdmin } = await supabase.rpc('is_workspace_admin', {
      _user_id: user.id,
      _workspace_id: workspaceId
    });

    if (!isAdmin) {
      console.error('SmartThings Sync - User not authorized for workspace');
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

    // Get SmartThings equipments for this workspace
    let query = supabase
      .from('equipments')
      .select('*')
      .eq('workspace_id', workspaceId)
      .not('smartthings_device_id', 'is', null);

    if (equipmentId) {
      query = query.eq('id', equipmentId);
    }

    const { data: equipments, error: eqError } = await query;

    if (eqError) throw eqError;

    console.log(`Found ${equipments?.length || 0} SmartThings equipments to sync`);

    const results = [];
    const now = new Date().toISOString();

    for (const equipment of equipments || []) {
      try {
        // Get device status from SmartThings
        const response = await fetch(
          `${SMARTTHINGS_API}/devices/${equipment.smartthings_device_id}/status`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          console.error(`Failed to get status for device ${equipment.smartthings_device_id}`);
          continue;
        }

        const status = await response.json();
        const mainComponent = status.components?.main || {};

        // Extract values from status
        const switchState = mainComponent.switch?.switch?.value;
        const currentTemp = mainComponent.temperatureMeasurement?.temperature?.value;
        const targetTemp = mainComponent.thermostatCoolingSetpoint?.coolingSetpoint?.value;
        const mode = mainComponent.airConditionerMode?.airConditionerMode?.value;

        // Map SmartThings mode to our mode
        const modeMap: Record<string, string> = {
          'cool': 'cool',
          'heat': 'heat',
          'auto': 'auto',
          'fanOnly': 'fan',
          'dry': 'cool',
        };

        // Update equipment in database
        const updates: any = {
          last_synced_at: now,
        };

        if (switchState !== undefined) {
          updates.is_on = switchState === 'on';
        }
        if (currentTemp !== undefined) {
          updates.current_temp = currentTemp;
        }
        if (targetTemp !== undefined) {
          updates.target_temp = targetTemp;
        }
        if (mode !== undefined) {
          updates.mode = modeMap[mode] || mode;
        }

        const { error: updateError } = await supabase
          .from('equipments')
          .update(updates)
          .eq('id', equipment.id);

        if (updateError) {
          console.error(`Failed to update equipment ${equipment.id}:`, updateError);
          continue;
        }

        // Record history
        if (updates.current_temp !== undefined || updates.target_temp !== undefined) {
          await supabase.from('temperature_history').insert({
            equipment_id: equipment.id,
            current_temp: updates.current_temp ?? equipment.current_temp,
            target_temp: updates.target_temp ?? equipment.target_temp,
            mode: updates.mode ?? equipment.mode,
            recorded_at: now,
          });
        }

        if (updates.is_on !== undefined) {
          await supabase.from('energy_history').insert({
            equipment_id: equipment.id,
            is_on: updates.is_on,
            energy_consumption: equipment.energy_consumption,
            efficiency: equipment.efficiency,
            recorded_at: now,
          });
        }

        results.push({
          equipmentId: equipment.id,
          deviceId: equipment.smartthings_device_id,
          success: true,
          updates,
        });

        console.log(`Synced equipment ${equipment.id} successfully`);

      } catch (err) {
        console.error(`Error syncing equipment ${equipment.id}:`, err);
        const errMessage = err instanceof Error ? err.message : 'Unknown error';
        results.push({
          equipmentId: equipment.id,
          success: false,
          error: errMessage,
        });
      }
    }

    // Update last_sync_at in config for this workspace
    await supabase
      .from('smartthings_config')
      .update({ last_sync_at: now })
      .eq('workspace_id', workspaceId)
      .eq('is_active', true);

    return new Response(
      JSON.stringify({ success: true, results, syncedAt: now }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SmartThings Sync Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
