import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Cabeçalho de autorização ausente.' }), { status: 401, headers: corsHeaders });
    }

    // 1. Crie um cliente para validar o JWT do chamador
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Token de usuário inválido.' }), { status: 401, headers: corsHeaders });
    }

    // 2. Crie um cliente de serviço para verificar a role do chamador (bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id) // Usando o ID verificado do token
      .single();

    if (profileError || callerProfile?.role !== 'admin') {
      console.error('Profile error or not admin:', profileError, callerProfile);
      return new Response(JSON.stringify({ error: 'Acesso negado. Apenas administradores podem personificar usuários.' }), { status: 403, headers: corsHeaders });
    }

    // 3. Se for um admin, prossiga para gerar o link de personificação
    const { userIdToImpersonate, userEmailToImpersonate } = await req.json();
    if (!userIdToImpersonate || !userEmailToImpersonate) {
      return new Response(JSON.stringify({ error: 'ID ou email do usuário alvo ausente.' }), { status: 400, headers: corsHeaders });
    }

    // Use o mesmo cliente de serviço para gerar o link
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmailToImpersonate,
      options: {
        redirectTo: '/', // Redireciona para a página inicial após o login
      },
    });

    if (linkError) {
      throw linkError;
    }

    return new Response(JSON.stringify({ signInLink: data.properties.action_link }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Erro na função de personificação:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});