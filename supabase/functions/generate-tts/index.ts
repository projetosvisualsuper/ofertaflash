import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// URL da API da OpenAI TTS
const OPENAI_API_URL = "https://api.openai.com/v1/audio/speech";
// Voz em Português (ex: 'onyx' ou 'nova' são boas opções)
const DEFAULT_VOICE = "nova"; 
const DEFAULT_MODEL = "tts-1";

serve(async (req) => {
  // 1. Handle CORS OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 2. Get API Key from Supabase Secrets
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured. Please set the secret.' }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  try {
    const { text, voiceStyle } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Missing text parameter' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 3. Call OpenAI API
    const ttsPayload = {
      model: DEFAULT_MODEL,
      input: text,
      voice: DEFAULT_VOICE,
      response_format: "mp3",
    };

    const ttsResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(ttsPayload),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("OpenAI API Error:", errorText);
      return new Response(JSON.stringify({ error: 'Failed to synthesize speech with OpenAI', details: errorText }), {
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
    console.error(error);
    return new Response(JSON.stringify({ error: 'Internal server error during OpenAI TTS generation' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});