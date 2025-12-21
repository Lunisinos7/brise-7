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
    const { action, token } = await req.json();
    
    console.log(`SmartThings Auth - Action: ${action}`);

    if (action === 'validate') {
      // Validate token by fetching locations
      const response = await fetch(`${SMARTTHINGS_API}/locations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('SmartThings API Error:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Token inválido ou expirado' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      console.log('Locations found:', data.items?.length || 0);

      return new Response(
        JSON.stringify({ 
          success: true, 
          locations: data.items || [],
          message: 'Token válido' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'save') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { locationId } = await req.json();

      // Check if config already exists
      const { data: existing } = await supabase
        .from('smartthings_config')
        .select('id')
        .limit(1)
        .single();

      if (existing) {
        // Update existing config
        const { error } = await supabase
          .from('smartthings_config')
          .update({
            personal_access_token: token,
            location_id: locationId,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new config
        const { error } = await supabase
          .from('smartthings_config')
          .insert({
            personal_access_token: token,
            location_id: locationId,
            is_active: true,
          });

        if (error) throw error;
      }

      console.log('SmartThings config saved successfully');

      return new Response(
        JSON.stringify({ success: true, message: 'Configuração salva com sucesso' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SmartThings Auth Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
