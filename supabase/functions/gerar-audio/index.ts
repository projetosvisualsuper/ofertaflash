import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import OpenAI from "npm:openai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // O frontend envia 'text'
    const { text } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "Texto não enviado" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    });

    const result = await openai.audio.speech.create({
      // CORREÇÃO: Usando o modelo padrão 'tts-1'
      model: "tts-1", 
      voice: "alloy",
      input: text,
      format: "mp3",
    });

    const arrayBuffer = await result.arrayBuffer();

    // Validação de buffer (byteLength < 100)
    if (!arrayBuffer || arrayBuffer.byteLength < 100) {
      console.error("TTS Generation failed: Empty or too small buffer.");
      return new Response(JSON.stringify({ error: "Falha ao gerar áudio: Buffer vazio ou corrompido. Verifique a chave API e o modelo." }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Usando Uint8Array para Deno
    const bytes = new Uint8Array(arrayBuffer);

    return new Response(bytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Content-Length": bytes.byteLength.toString(), // Adicionando Content-Length
        "Cache-Control": "no-cache",
      },
      status: 200,
    });

  } catch (err) {
    const errorMessage = err.message || "Erro interno desconhecido.";
    console.error("Erro interno na Edge Function:", errorMessage);
    // Retorna erro JSON para o frontend
    return new Response(JSON.stringify({ error: "Erro interno na Edge Function: " + errorMessage }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});