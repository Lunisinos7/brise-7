import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting energy data collection...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all active equipments across all workspaces
    const { data: equipments, error: equipmentsError } = await supabase
      .from('equipments')
      .select('id, is_on, energy_consumption, current_temp, target_temp, mode, workspace_id')
      .eq('is_on', true);

    if (equipmentsError) {
      console.error('Error fetching equipments:', equipmentsError);
      throw equipmentsError;
    }

    console.log(`Found ${equipments?.length || 0} active equipments`);

    if (!equipments || equipments.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active equipments to record',
          recorded: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date().toISOString();
    let energyRecordsInserted = 0;
    let temperatureRecordsInserted = 0;

    // Collection interval in hours (30 minutes = 0.5 hours)
    const COLLECTION_INTERVAL_HOURS = 0.5;

    // Prepare batch inserts
    // Convert watts to kWh: kWh = (watts × hours) / 1000
    const energyHistoryRecords = equipments.map(eq => {
      const watts = eq.energy_consumption || 0;
      const kWh = (watts * COLLECTION_INTERVAL_HOURS) / 1000;
      
      console.log(`Equipment ${eq.id}: ${watts}W → ${kWh.toFixed(4)} kWh (${COLLECTION_INTERVAL_HOURS}h interval)`);
      
      return {
        equipment_id: eq.id,
        energy_consumption: kWh,
        is_on: eq.is_on,
        recorded_at: now,
      };
    });

    const temperatureHistoryRecords = equipments.map(eq => ({
      equipment_id: eq.id,
      current_temp: eq.current_temp || 25,
      target_temp: eq.target_temp || 22,
      mode: eq.mode || 'cool',
      recorded_at: now,
    }));

    // Insert energy history records
    const { error: energyError, data: energyData } = await supabase
      .from('energy_history')
      .insert(energyHistoryRecords)
      .select();

    if (energyError) {
      console.error('Error inserting energy history:', energyError);
    } else {
      energyRecordsInserted = energyData?.length || 0;
      console.log(`Inserted ${energyRecordsInserted} energy history records`);
    }

    // Insert temperature history records
    const { error: tempError, data: tempData } = await supabase
      .from('temperature_history')
      .insert(temperatureHistoryRecords)
      .select();

    if (tempError) {
      console.error('Error inserting temperature history:', tempError);
    } else {
      temperatureRecordsInserted = tempData?.length || 0;
      console.log(`Inserted ${temperatureRecordsInserted} temperature history records`);
    }

    const result = {
      success: true,
      message: 'Energy data collection completed',
      recorded_at: now,
      energy_records: energyRecordsInserted,
      temperature_records: temperatureRecordsInserted,
      equipments_processed: equipments.length,
    };

    console.log('Collection result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in collect-energy-data:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
