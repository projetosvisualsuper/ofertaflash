import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// Voice ID fornecido pelo usuário, que deve ser compatível com o plano e o modelo multilingual.
const USER_VOICE_ID = "rpNe0HOx7heUulPiOEaG"; 
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";

serve(async (req) => {
  // 1. Handle CORS OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 2. Get API Key from Supabase Secrets
  const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
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
    
    // 3. Call ElevenLabs API usando o ID de voz do usuário
    const ttsPayload = {
      text: text,
      model_id: "eleven_multilingual_v2", // Modelo que suporta pt-BR
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
      },
    };

    const ttsResponse = await fetch(`${ELEVENLABS_API_URL}/${USER_VOICE_ID}`, {
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
          details = errorJson.detail || errorText;
      } catch (e) {
          // Ignora erro de parse se não for JSON
      }
      
      return new Response(JSON.stringify({ error: 'Failed to synthesize speech with ElevenLabs', details: details }), {
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
    return new Response(JSON.stringify({ error: 'Internal server error during ElevenLabs TTS generation' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});