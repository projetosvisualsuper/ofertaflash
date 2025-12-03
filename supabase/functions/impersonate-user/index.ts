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
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication failed' }), { status: 401, headers: corsHeaders });
    }

    // 4. Verifique se o usuário autenticado é um administrador.
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Permission denied: User is not an admin' }), { status: 403, headers: corsHeaders });
    }

    // 5. Se for um admin, gere o link de personificação para o usuário alvo.
    const { userEmailToImpersonate } = await req.json();
    if (!userEmailToImpersonate) {
      return new Response(JSON.stringify({ error: 'Target user email is missing' }), { status: 400, headers: corsHeaders });
    }

    // Gera o link de login mágico
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmailToImpersonate,
      options: {
        // Redireciona para a raiz do aplicativo
        redirectTo: '/',
      },
    });

    if (linkError) {
      throw linkError;
    }

    // 6. Retorne o link gerado.
    return new Response(JSON.stringify({ signInLink: linkData.properties.action_link }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in impersonate-user function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});