import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
const ELEVENLABS_VOICE_ID = Deno.env.get('ELEVENLABS_VOICE_ID') || '21m00Tcm4TlvDq8ikWAM'; // Fallback para uma voz padrão

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // A autenticação é feita na função chamadora (gerar-audio), mas verificamos a chave aqui.
  if (!ELEVENLABS_API_KEY) {
    console.error("ElevenLabs Error: API Key not configured.");
    return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY não configurada." }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { text } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "Texto não enviado" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // --- CHAMADA À API ELEVENLABS ---
    
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
            text: text,
            model_id: "eleven_multilingual_v2", // Modelo que suporta Português
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5,
            },
        }),
    });

    if (!ttsResponse.ok) {
        let errorDetails = "Falha na API de TTS da ElevenLabs.";
        try {
            const errorJson = await ttsResponse.json();
            errorDetails = errorJson.detail || errorDetails;
        } catch (e) {
            // Ignora se não for JSON
        }
        console.error("ElevenLabs TTS API Error:", ttsResponse.status, errorDetails);
        // Retorna o erro como JSON para que a função chamadora possa capturá-lo
        return new Response(JSON.stringify({ error: `Falha na geração de áudio (Status ${ttsResponse.status}): ${errorDetails}` }), { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    // Retorna o ArrayBuffer diretamente para o cliente
    const audioBuffer = await ttsResponse.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg", // Garante o tipo correto
        "Content-Length": audioBuffer.byteLength.toString(),
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