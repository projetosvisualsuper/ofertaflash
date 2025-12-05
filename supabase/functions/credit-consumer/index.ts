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
  
  // 1. Autenticação (usando o token do usuário)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { status: 401, headers: corsHeaders });
  }
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!, // Usamos a chave anon para o cliente, mas o token do usuário para auth
    {
        global: { headers: { 'Authorization': authHeader } }
    }
  );
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token or user not found' }), { status: 401, headers: corsHeaders });
  }

  try {
    const { amount, description } = await req.json();

    if (typeof amount !== 'number' || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount specified' }), { status: 400, headers: corsHeaders });
    }
    
    // 2. Chama a função RPC de consumo atômico
    // NOTA: Como estamos chamando a RPC com o cliente autenticado (supabase), 
    // a RLS e a GRANT de EXECUTE garantem que o user_id seja o do token.
    const { data: newBalance, error: rpcError } = await supabase.rpc('consume_ai_credits', {
        p_user_id: user.id,
        p_amount: amount,
        p_description: description || 'Consumo de IA',
    });

    if (rpcError) {
        // Se a RPC falhar (ex: saldo insuficiente), retorna o erro
        console.error("Credit RPC Error:", rpcError);
        return new Response(JSON.stringify({ error: rpcError.message }), { status: 402, headers: corsHeaders }); // 402 Payment Required
    }

    // 3. Retorna o novo saldo
    return new Response(JSON.stringify({ 
        success: true, 
        newBalance: newBalance,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in credit-consumer function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});