import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import OpenAI from "npm:openai";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Custo da operação
const CREDIT_COST = 5; 

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
    
    // --- 1. CONSUMIR CRÉDITOS ---
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { 'Authorization': authHeader } } }
    );
    
    const { data: creditData, error: creditError } = await supabase.functions.invoke('credit-consumer', {
        method: 'POST',
        body: { 
            amount: CREDIT_COST, 
            description: `Consumo de ${CREDIT_COST} créditos para Geração de Áudio (TTS)` 
        },
        headers: { 'Authorization': authHeader }
    });

    if (creditError || creditData.error) {
        const errorMessage = creditData?.error || creditError?.message || "Erro desconhecido ao consumir créditos.";
        console.error("Credit Consumption Failed:", errorMessage);
        // Retorna 402 se for erro de saldo insuficiente
        const status = errorMessage.includes('Saldo insuficiente') ? 402 : 500;
        return new Response(JSON.stringify({ error: errorMessage }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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