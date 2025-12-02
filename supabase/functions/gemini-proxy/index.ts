import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import * as GenAI from "https://esm.sh/@google/genai@0.14.0"; // Importação completa
import { Type, HarmCategory, HarmBlockThreshold } from "https://esm.sh/@google/genai@0.14.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuração de segurança para desativar a filtragem de conteúdo
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
  // ... (restante das configurações de segurança)
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in Supabase secrets.");
    }
    const ai = new GenAI.GoogleGenAI({ apiKey }); // Usando GenAI.GoogleGenAI

    const { task, data } = await req.json();
    let response;

    switch (task) {
      case 'generateMarketingCopy': {
        const { topic } = data;
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Write a catchy, short, and exciting headline (max 8 words) for a retail sales poster about: ${topic}. Language: Portuguese (Brazil). Do not include quotes.`,
          config: {
            safetySettings: safetySettings,
          },
        });
        break;
      }
      case 'parseProductsFromText': {
        const { text } = data;
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Extract a list of products with prices from this text. Return a JSON array. 
          Text: "${text}"
          
          Format:
          [
            {
              "name": "Product Name / Title",
              "description": "Short product description" (optional),
              "price": "9.99",
              "oldPrice": "12.99" (optional),
              "unit": "un" (or kg, g, etc - guess based on context)
            }
          ]`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  price: { type: Type.STRING },
                  oldPrice: { type: Type.STRING },
                  unit: { type: Type.STRING },
                },
                required: ["name", "price", "unit"],
              },
            },
            safetySettings: safetySettings,
          },
        });
        break;
      }
      case 'generateBackgroundImage': {
        const { prompt } = data;
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: {
            parts: [
              {
                text: `Background image for a supermarket flyer, texture, marketing background, high quality, 8k, ${prompt}`,
              },
            ],
          },
          config: {
            safetySettings: safetySettings,
          },
        });
        break;
      }
      case 'generateAdScript': {
        const { products } = data;
        const productDetails = products.map(p => 
          `Nome: ${p.name}, Preço: R$ ${p.price} / ${p.unit}, De: ${p.oldPrice ? `R$ ${p.oldPrice}` : 'Não aplicável'}, Descrição: ${p.description || 'Nenhuma'}`
        ).join('\n---\n');

        const prompt = `Crie um roteiro de anúncio de áudio/vídeo curto (máximo 30 segundos) para as seguintes ofertas em Português (Brasil). O roteiro deve ser dividido em 3 ou 4 cenas/partes, incluindo uma chamada para ação clara.

        Detalhes dos Produtos:
        ${productDetails}

        Gere a resposta em formato JSON, seguindo exatamente o schema fornecido.

        Schema JSON:
        {
          "headline": "Frase de impacto curta para o anúncio",
          "script": "O roteiro completo, formatado com quebras de linha e marcadores de cena (ex: [CENA 1: Abertura])",
          "suggestions": {
            "music": "Sugestão de estilo musical (ex: Jingle animado, Música de suspense)",
            "voice": "Sugestão de estilo de voz do locutor (ex: Entusiasmado e rápido, Calmo e persuasivo)"
          }
        }`;
        
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                script: { type: Type.STRING },
                suggestions: {
                  type: Type.OBJECT,
                  properties: {
                    music: { type: Type.STRING },
                    voice: { type: Type.STRING },
                  },
                  required: ["music", "voice"],
                },
              },
              required: ["headline", "script", "suggestions"],
            },
            safetySettings: safetySettings, // Aplicando safety settings
          },
        });
        break;
      }
      case 'generateProductImage': { // NOVO CASE
        const { productName } = data;
        const prompt = `High quality, professional product photo of ${productName} on a clean white background, studio lighting, no text, photorealistic.`;

        try {
            response = await ai.models.generateContent({
              model: "gemini-2.5-flash-image",
              contents: {
                parts: [
                  { text: prompt },
                ],
              },
              // Não aplicamos safetySettings aqui, pois o modelo de imagem pode não suportar na Edge Function.
            });
        } catch (geminiError) {
            console.error("Gemini Image Generation Error:", geminiError);
            return new Response(JSON.stringify({ error: `Gemini API failed to generate image: ${geminiError.message}` }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        
        // Processamento da resposta de imagem
        const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        
        if (!imagePart || !imagePart.inlineData) {
            return new Response(JSON.stringify({ error: 'AI failed to generate image content or response was blocked.' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        
        // Retorna o Base64 e o MIME type diretamente
        return new Response(JSON.stringify({ 
            imageBase64: imagePart.inlineData.data,
            mimeType: imagePart.inlineData.mimeType,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      default:
        return new Response(JSON.stringify({ error: 'Invalid task' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    
    // VERIFICAÇÃO CRÍTICA: Se a resposta do Gemini não tiver texto, algo deu errado na geração.
    if (!response || !response.text || response.text.trim() === "") {
        // Adiciona log detalhado sobre o motivo do bloqueio, se disponível
        const blockReason = response.candidates?.[0]?.finishReason;
        const safetyRatings = response.candidates?.[0]?.safetyRatings;
        
        console.error("Gemini API returned no text response for task:", task, { blockReason, safetyRatings });
        
        let errorMessage = 'Gemini API returned empty response.';
        if (blockReason === 'SAFETY') {
            errorMessage = 'A resposta foi bloqueada pelas configurações de segurança do Gemini. Tente um prompt diferente.';
        } else if (blockReason === 'RECITATION') {
            errorMessage = 'A resposta foi bloqueada por recitação de conteúdo protegido.';
        } else if (blockReason) {
            errorMessage = `A geração falhou devido a: ${blockReason}.`;
        }

        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});