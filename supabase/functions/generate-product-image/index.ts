import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { GoogleGenAI } from "https://esm.sh/@google/genai@0.14.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in Supabase secrets.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const { productName } = await req.json();
    if (!productName) {
      return new Response(JSON.stringify({ error: 'Missing productName parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prompt para gerar uma imagem de produto com fundo branco/transparente
    const prompt = `High quality, professional product photo of ${productName} on a clean white background, studio lighting, no text, photorealistic.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { text: prompt },
        ],
      },
    });

    // Extrair o Base64 da imagem
    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    
    if (!imagePart || !imagePart.inlineData) {
        return new Response(JSON.stringify({ error: 'AI failed to generate image content.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ 
        imageBase64: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in generate-product-image function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});