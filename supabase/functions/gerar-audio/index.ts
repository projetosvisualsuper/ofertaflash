import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import OpenAI from "npm:openai";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized: Missing Authorization header" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { text } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "Texto não enviado" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const serviceKey = 'generate_audio';
    
    // --- 1. BUSCAR CUSTO E VERIFICAR ADMIN ---
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // 1a. Obter o ID do usuário logado
    const supabaseAnon = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { 'Authorization': authHeader } } }
    );
    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser();
    if (userError || !user) throw new Error("User not authenticated.");
    
    // 1b. Verificar o role do usuário (usando a função de segurança)
    const { data: roleData } = await supabaseAdmin.rpc('get_my_role', {
        // Não precisa de argumentos, mas a função precisa ser chamada
    }).auth.session({ access_token: authHeader.replace('Bearer ', '') });
    
    const userRole = roleData || 'free';
    
    let creditCost = 0;
    let description = '';
    
    if (userRole !== 'admin') {
        // 1c. Buscar o custo dinamicamente
        const { data: costData, error: costError } = await supabaseAdmin
            .from('ai_costs')
            .select('cost, description')
            .eq('service_key', serviceKey)
            .single();
            
        if (costError || !costData) {
            console.warn(`AI Cost not found for ${serviceKey}. Using default 5.`);
            creditCost = 5; // Fallback
            description = `Consumo de 5 créditos (Fallback)`;
        } else {
            creditCost = costData.cost;
            description = costData.description;
        }
    }
    
    // --- 2. CONSUMIR CRÉDITOS (SE NÃO FOR ADMIN E O CUSTO FOR > 0) ---
    if (userRole !== 'admin' && creditCost > 0) {
        const { data: creditData, error: creditError } = await supabaseAnon.functions.invoke('credit-consumer', {
            method: 'POST',
            body: { amount: creditCost, description: description },
            headers: { 'Authorization': authHeader }
        });

        if (creditError || creditData.error) {
            const errorMessage = creditData?.error || creditError?.message || "Erro desconhecido ao consumir créditos.";
            console.error("Credit Consumption Failed:", errorMessage);
            const status = errorMessage.includes('Saldo insuficiente') ? 402 : 500;
            return new Response(JSON.stringify({ error: errorMessage }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
    }
    // --- FIM CONSUMO DE CRÉDITOS ---

    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    });

    const result = await openai.audio.speech.create({
      model: "tts-1", 
      voice: "alloy",
      input: text,
      format: "mp3",
    });

    const arrayBuffer = await result.arrayBuffer();

    if (!arrayBuffer || arrayBuffer.byteLength < 100) {
      console.error("TTS Generation failed: Empty or too small buffer.");
      // NOTA: Em caso de falha APÓS o consumo, o crédito deve ser reembolsado.
      // Por simplicidade, não implementaremos o reembolso aqui, mas é uma consideração de produção.
      return new Response(JSON.stringify({ error: "Falha ao gerar áudio: Buffer vazio ou corrompido." }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const bytes = new Uint8Array(arrayBuffer);

    return new Response(bytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Content-Length": bytes.byteLength.toString(),
        "Cache-Control": "no-cache",
      },
      status: 200,
    });

  } catch (err) {
    const errorMessage = err.message || "Erro interno desconhecido.";
    console.error("Erro interno na Edge Function:", errorMessage);
    return new Response(JSON.stringify({ error: "Erro interno na Edge Function: " + errorMessage }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});