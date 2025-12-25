import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BRISE_API_BASE = "https://brisev2.agst.com.br:8090/api/v2";

interface LoginRequest {
  action: "login";
  email: string;
  password: string;
  workspaceId: string;
}

interface RefreshRequest {
  action: "refresh";
  workspaceId: string;
}

interface DisconnectRequest {
  action: "disconnect";
  workspaceId: string;
}

type RequestBody = LoginRequest | RefreshRequest | DisconnectRequest;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: RequestBody = await req.json();
    console.log(`[brise-auth] Action: ${body.action}`);

    if (body.action === "login") {
      const { email, password, workspaceId } = body as LoginRequest;

      if (!email || !password || !workspaceId) {
        return new Response(
          JSON.stringify({ error: "Email, password and workspaceId are required" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[brise-auth] Attempting login for: ${email}`);

      // Authenticate with BRISE API
      const loginResponse = await fetch(`${BRISE_API_BASE}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: {
            email,
            password,
          }
        }),
      });

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        console.error(`[brise-auth] Login failed: ${loginResponse.status} - ${errorText}`);
        return new Response(
          JSON.stringify({ error: "Invalid credentials", details: errorText }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const loginData = await loginResponse.json();
      console.log(`[brise-auth] Login successful for: ${email}`);

      // Extract tokens from response
      const accessToken = loginData.jwt || loginData.access_token || loginData.token;
      const refreshToken = loginData.refresh_token || null;
      
      // Calculate token expiration (BRISE tokens typically expire in 24 hours)
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24);

      // Check if config already exists for this workspace
      const { data: existingConfig } = await supabase
        .from('brise_config')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .single();

      if (existingConfig) {
        // Update existing config
        const { error: updateError } = await supabase
          .from('brise_config')
          .update({
            user_email: email,
            access_token: accessToken,
            refresh_token: refreshToken,
            token_expires_at: tokenExpiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingConfig.id);

        if (updateError) {
          console.error(`[brise-auth] Error updating config:`, updateError);
          throw updateError;
        }
      } else {
        // Create new config
        const { error: insertError } = await supabase
          .from('brise_config')
          .insert({
            workspace_id: workspaceId,
            user_email: email,
            access_token: accessToken,
            refresh_token: refreshToken,
            token_expires_at: tokenExpiresAt.toISOString(),
            is_active: true,
          });

        if (insertError) {
          console.error(`[brise-auth] Error inserting config:`, insertError);
          throw insertError;
        }
      }

      return new Response(
        JSON.stringify({ success: true, email }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (body.action === "refresh") {
      const { workspaceId } = body as RefreshRequest;

      // Get current config
      const { data: config, error: configError } = await supabase
        .from('brise_config')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .single();

      if (configError || !config) {
        return new Response(
          JSON.stringify({ error: "No active BRISE configuration found" }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if we have a refresh token
      if (!config.refresh_token) {
        return new Response(
          JSON.stringify({ error: "No refresh token available, please re-authenticate" }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Attempt to refresh the token
      const refreshResponse = await fetch(`${BRISE_API_BASE}/session/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.refresh_token}`,
        },
      });

      if (!refreshResponse.ok) {
        console.error(`[brise-auth] Token refresh failed`);
        return new Response(
          JSON.stringify({ error: "Token refresh failed, please re-authenticate" }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const refreshData = await refreshResponse.json();
      const newAccessToken = refreshData.jwt || refreshData.access_token || refreshData.token;
      const newRefreshToken = refreshData.refresh_token || config.refresh_token;
      
      const newTokenExpiresAt = new Date();
      newTokenExpiresAt.setHours(newTokenExpiresAt.getHours() + 24);

      // Update the config with new tokens
      await supabase
        .from('brise_config')
        .update({
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          token_expires_at: newTokenExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (body.action === "disconnect") {
      const { workspaceId } = body as DisconnectRequest;

      const { error } = await supabase
        .from('brise_config')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('workspace_id', workspaceId)
        .eq('is_active', true);

      if (error) {
        console.error(`[brise-auth] Error disconnecting:`, error);
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[brise-auth] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
