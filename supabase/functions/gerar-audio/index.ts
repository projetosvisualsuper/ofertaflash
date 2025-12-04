import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
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
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set in Supabase secrets.");
    }
    
    const { text } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: 'Missing text parameter' }), { status: 400, headers: corsHeaders });
    }

    const openai = new OpenAI({ apiKey });

    // 1. Chamar a API de TTS da OpenAI
    const response = await openai.audio.speech.create({
      model: "tts-1", // Modelo padrão de alta qualidade
      voice: "alloy", // Voz padrão que soa bem
      input: text,
      response_format: "mp3"
    });

    // 2. Obter o ArrayBuffer do áudio
    const audioBuffer = await response.arrayBuffer();
    
    // 3. Retornar o áudio como Blob/ArrayBuffer
    return new Response(audioBuffer, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="speech.mp3"',
      },
      status: 200,
    });

  } catch (error) {
    console.error("Error in OpenAI TTS Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});