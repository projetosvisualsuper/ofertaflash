import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";

// Voice ID padrão para o modelo multilingual (Adam) - Usado como fallback
const FALLBACK_VOICE_ID = "pNInz6obpgDQGcFJFTif"; 

serve(async (req) => {
  // 1. Handle CORS OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 2. Get API Key and Voice ID from Supabase Secrets
  const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
  // Prioriza a Voice ID definida pelo usuário, caso contrário, usa o fallback
  const voiceId = Deno.env.get('ELEVENLABS_VOICE_ID') || FALLBACK_VOICE_ID; 
  
  if (!apiKey) {
    console.error("TTS Error: ELEVENLABS_API_KEY is missing from environment.");
    return new Response(JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured. Please set the secret.' }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  try {
    const { text } = await req.json(); 

    if (!text) {
      return new Response(JSON.stringify({ error: 'Missing text parameter' }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    
    const ttsPayload = {
      text: text,
      model_id: "eleven_multilingual_v2", // Modelo que suporta pt-BR
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
      },
    };

    // Usando a Voice ID (do Secret ou Fallback)
    const ttsResponse = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify(ttsPayload),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("ElevenLabs TTS API Error:", ttsResponse.status, errorText);
      
      let details = errorText;
      try {
          const errorJson = JSON.parse(errorText);
          details = errorJson.detail?.message || errorJson.detail || errorText;
      } catch (e) {
          // Ignora erro de parse se não for JSON
      }
      
      // Se falhar, retorna a mensagem de erro detalhada, incluindo a Voice ID usada
      return new Response(JSON.stringify({ 
          error: 'Failed to synthesize speech with ElevenLabs', 
          details: `Verifique se a Voice ID (${voiceId}) está disponível na sua conta. Detalhe: ${details}` 
      }), {
        status: ttsResponse.status,
        headers: corsHeaders,
      });
    }

    // 4. Read the audio stream as ArrayBuffer
    const audioBuffer = await ttsResponse.arrayBuffer();
    
    // 5. Convert ArrayBuffer to Base64
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
    
    // 6. Return the audio content (base64 encoded MP3)
    return new Response(JSON.stringify({ audioContent: audioBase64 }), {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error) {
    console.error("TTS Catch Error:", error);
    return new Response(JSON.stringify({ error: 'Internal server error during ElevenLabs TTS generation', details: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});