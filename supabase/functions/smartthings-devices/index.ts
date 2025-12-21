import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SMARTTHINGS_API = 'https://api.smartthings.com/v1';

// Capabilities that identify air conditioners
const AC_CAPABILITIES = [
  'airConditionerMode',
  'thermostatCoolingSetpoint',
  'airConditionerFanMode',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get SmartThings config
    const { data: config, error: configError } = await supabase
      .from('smartthings_config')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (configError || !config) {
      console.error('SmartThings config not found');
      return new Response(
        JSON.stringify({ error: 'SmartThings não está configurado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = config.personal_access_token;

    // Fetch devices from SmartThings
    console.log('Fetching devices from SmartThings...');
    const response = await fetch(`${SMARTTHINGS_API}/devices`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('SmartThings API Error:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar dispositivos' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`Total devices found: ${data.items?.length || 0}`);

    // Filter for air conditioners
    const airConditioners = (data.items || []).filter((device: any) => {
      const deviceCapabilities = device.components?.flatMap((c: any) => 
        c.capabilities?.map((cap: any) => cap.id) || []
      ) || [];
      
      return AC_CAPABILITIES.some(cap => deviceCapabilities.includes(cap));
    });

    console.log(`Air conditioners found: ${airConditioners.length}`);

    // Get already imported devices
    const { data: existingEquipments } = await supabase
      .from('equipments')
      .select('smartthings_device_id')
      .not('smartthings_device_id', 'is', null);

    const importedDeviceIds = new Set(
      existingEquipments?.map(e => e.smartthings_device_id) || []
    );

    // Format devices for response
    const devices = airConditioners.map((device: any) => {
      const capabilities = device.components?.flatMap((c: any) => 
        c.capabilities?.map((cap: any) => cap.id) || []
      ) || [];

      return {
        deviceId: device.deviceId,
        name: device.label || device.name,
        manufacturerName: device.manufacturerName || 'Unknown',
        model: device.deviceTypeName || device.type || 'Air Conditioner',
        locationId: device.locationId,
        roomId: device.roomId,
        capabilities,
        isImported: importedDeviceIds.has(device.deviceId),
      };
    });

    return new Response(
      JSON.stringify({ devices }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SmartThings Devices Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
