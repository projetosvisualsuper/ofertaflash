import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Crie um cliente Supabase com a chave de serviço para todas as operações.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 2. Obtenha o token do cabeçalho da requisição.
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Authentication token not found' }), { status: 401, headers: corsHeaders });
    }

    // 3. Valide o token para obter o usuário que está fazendo a chamada.
    // Nota: Usamos o cliente Admin para validar o token, pois o cliente normal pode falhar em Edge Functions.
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error("Auth validation failed:", authError?.message);
      return new Response(JSON.stringify({ error: 'Authentication failed or token expired' }), { status: 401, headers: corsHeaders });
    }

    // 4. Verifique se o usuário autenticado é um administrador.
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      console.warn(`Impersonation attempt by non-admin user: ${user.id}`);
      return new Response(JSON.stringify({ error: 'Permission denied: User is not an admin' }), { status: 403, headers: corsHeaders });
    }

    // 5. Obtenha os dados do corpo da requisição.
    const { userEmailToImpersonate, redirectTo } = await req.json();
    if (!userEmailToImpersonate) {
      return new Response(JSON.stringify({ error: 'Target user email is missing' }), { status: 400, headers: corsHeaders });
    }
    
    // Garante que o redirectTo seja sempre fornecido, caindo para a raiz se não for.
    const finalRedirectTo = redirectTo || '/';

    // 6. Gera o link de login mágico
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmailToImpersonate,
      options: {
        // Usa a URL de redirecionamento fornecida pelo frontend
        redirectTo: finalRedirectTo,
      },
    });

    if (linkError) {
      console.error("Supabase generateLink error:", linkError);
      throw new Error(`Failed to generate sign-in link: ${linkError.message}`);
    }

    // 7. Retorne o link gerado.
    return new Response(JSON.stringify({ signInLink: linkData.properties.action_link }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in impersonate-user function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});