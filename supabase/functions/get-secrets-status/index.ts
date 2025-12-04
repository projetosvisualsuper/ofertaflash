import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Esta função não requer autenticação, pois apenas verifica se os segredos estão definidos.
  // No entanto, em um ambiente de produção, você pode querer restringir isso a usuários autenticados.

  try {
    const metaAppId = Deno.env.get('META_APP_ID');
    const metaAppSecret = Deno.env.get('META_APP_SECRET');

    return new Response(JSON.stringify({
      META_APP_ID: metaAppId ? 'CONFIGURED' : null,
      META_APP_SECRET: metaAppSecret ? 'CONFIGURED' : null,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in get-secrets-status function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});