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
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) throw new Error("User not authenticated or token invalid.");
    
    const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    const userRole = profileData?.role || 'free';
    
    let creditCost = 0;
    let description = '';
    
    if (userRole !== 'admin') {
        const { data: costData, error: costError } = await supabaseAdmin
            .from('ai_costs')
            .select('cost, description')
            .eq('service_key', serviceKey)
            .single();
            
        if (costError || !costData) {
            creditCost = 5; // Fallback
            description = `Consumo de 5 créditos (Fallback)`;
        } else {
            creditCost = costData.cost;
            description = costData.description;
        }
    }
    
    // --- 2. CONSUMIR CRÉDITOS (SE NÃO FOR ADMIN E O CUSTO FOR > 0) ---
    if (userRole !== 'admin' && creditCost > 0) {
        const supabaseAnon = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
        );
        
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

    // --- 3. CHAMAR A EDGE FUNCTION DA ELEVENLABS INTERNAMENTE ---
    const elevenLabsUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/elevenlabs-tts`;
    
    const ttsResponse = await fetch(elevenLabsUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader, 
        },
        body: JSON.stringify({ text }),
    });
    
    // Se a chamada interna falhar (ex: 500), tentamos ler o corpo do erro JSON
    if (!ttsResponse.ok) {
        let errorDetails = "Falha na chamada interna para ElevenLabs TTS.";
        try {
            const errorJson = await ttsResponse.json();
            errorDetails = errorJson.error || errorDetails;
        } catch (e) {
            // Se não for JSON, apenas usa o status
            errorDetails = `Erro de rede ou Edge Function interna falhou (Status ${ttsResponse.status}).`;
        }
        console.error("Internal TTS Call Failed:", ttsResponse.status, errorDetails);
        // Retorna o erro para o frontend
        return new Response(JSON.stringify({ error: `Falha na geração de áudio: ${errorDetails}` }), { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    // Retorna o ArrayBuffer (MP3) da ElevenLabs diretamente para o cliente
    const audioBuffer = await ttsResponse.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
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