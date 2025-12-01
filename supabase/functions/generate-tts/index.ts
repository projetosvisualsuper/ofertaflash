import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// URL da API do Google Cloud Text-to-Speech
const TTS_API_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

serve(async (req) => {
  // 1. Handle CORS OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 2. Get API Key from Supabase Secrets
  const apiKey = Deno.env.get('GOOGLE_CLOUD_TTS_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'TTS API Key not configured' }), {
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

    // Mapeamento simplificado de estilo de voz para um nome de voz do Google Cloud TTS
    // Nota: O mapeamento real pode ser mais complexo e exigir uma lista de vozes disponíveis.
    // Usaremos uma voz padrão em português (pt-BR)
    const voiceName = 'pt-BR-Standard-A'; 

    const ttsPayload = {
      input: { text: text },
      voice: { languageCode: 'pt-BR', name: voiceName },
      audioConfig: { audioEncoding: 'MP3' },
    };

    // 3. Call Google Cloud TTS API
    const ttsResponse = await fetch(`${TTS_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ttsPayload),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("TTS API Error:", errorText);
      return new Response(JSON.stringify({ error: 'Failed to synthesize speech', details: errorText }), {
        status: ttsResponse.status,
        headers: corsHeaders,
      });
    }

    const ttsData = await ttsResponse.json();
    
    // 4. Return the audio content (base64 encoded MP3)
    return new Response(JSON.stringify({ audioContent: ttsData.audioContent }), {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});