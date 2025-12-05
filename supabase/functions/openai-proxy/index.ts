import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_URL = "https://api.openai.com/v1";

// Custo das operações
const COST_TEXT = 1;
const COST_IMAGE = 10;

async function callOpenAI(endpoint: string, apiKey: string, payload: any) {
    const response = await fetch(`${OPENAI_API_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenAI API Error (${endpoint}):`, errorText);
        throw new Error(`OpenAI API failed: ${response.status} - ${errorText}`);
    }
    return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized: Missing Authorization header" }), { status: 401, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set in Supabase secrets.");
    }

    const { task, data } = await req.json();
    let result;
    let creditCost = 0;
    let description = '';
    
    switch (task) {
      case 'generateMarketingCopy':
      case 'parseProductsFromText':
      case 'generateAdScript':
        creditCost = COST_TEXT;
        description = `Consumo de ${COST_TEXT} crédito para Geração de Texto/Roteiro (GPT-4o-mini)`;
        break;
      case 'generateBackgroundImage':
      case 'generateProductImage':
        creditCost = COST_IMAGE;
        description = `Consumo de ${COST_IMAGE} créditos para Geração de Imagem (DALL-E 3)`;
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid task' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    
    // --- 1. CONSUMIR CRÉDITOS ---
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { 'Authorization': authHeader } } }
    );
    
    const { data: creditData, error: creditError } = await supabase.functions.invoke('credit-consumer', {
        method: 'POST',
        body: { amount: creditCost, description: description },
        headers: { 'Authorization': authHeader }
    });

    if (creditError || creditData.error) {
        const errorMessage = creditData?.error || creditError?.message || "Erro desconhecido ao consumir créditos.";
        console.error("Credit Consumption Failed:", errorMessage);
        // Retorna 402 se for erro de saldo insuficiente
        const status = errorMessage.includes('Saldo insuficiente') ? 402 : 500;
        return new Response(JSON.stringify({ error: errorMessage }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    // --- FIM CONSUMO DE CRÉDITOS ---

    // --- 2. EXECUTAR TAREFA DE IA ---
    switch (task) {
      case 'generateMarketingCopy': {
        const { topic } = data;
        const prompt = `Write a catchy, short, and exciting headline (max 8 words) for a retail sales poster about: ${topic}. Language: Portuguese (Brazil). Do not include quotes. Return only the headline text.`;
        
        const chatResponse = await callOpenAI('chat/completions', apiKey, {
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });
        result = { text: chatResponse.choices[0].message.content };
        break;
      }
      case 'parseProductsFromText': {
        const { text } = data;
        const prompt = `Extract a list of products with prices from this text. Return a JSON array that strictly follows the provided schema. Use Portuguese (Brazil).
          Text: "${text}"
          
          Schema:
          [
            {
              "name": "Product Name / Title",
              "description": "Short product description" (optional),
              "price": "9.99",
              "oldPrice": "12.99" (optional),
              "unit": "un" (or kg, g, etc - guess based on context)
            }
          ]`;
          
        const chatResponse = await callOpenAI('chat/completions', apiKey, {
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.1,
        });
        
        const jsonContent = chatResponse.choices[0].message.content;
        
        try {
            const parsed = JSON.parse(jsonContent);
            if (parsed.products && Array.isArray(parsed.products)) {
                result = { text: JSON.stringify(parsed.products) };
            } else {
                result = { text: jsonContent };
            }
        } catch (e) {
            result = { text: jsonContent };
        }
        break;
      }
      case 'generateBackgroundImage':
      case 'generateProductImage': {
        const { prompt: userPrompt } = data;
        const isProduct = task === 'generateProductImage';
        
        const basePrompt = isProduct 
            ? `High quality, professional product photo of ${userPrompt} on a clean white background, studio lighting, no text, photorealistic.`
            : `Background image for a supermarket flyer, texture, marketing background, high quality, 8k, ${userPrompt}`;
            
        const imageResponse = await callOpenAI('images/generations', apiKey, {
            model: "dall-e-3",
            prompt: basePrompt,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json",
        });
        
        const imageBase64 = imageResponse.data[0].b64_json;
        
        return new Response(JSON.stringify({ 
            imageBase64: imageBase64,
            mimeType: 'image/png',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      case 'generateAdScript': {
        const { products } = data;
        const productDetails = products.map(p => 
          `Nome: ${p.name}, Preço: R$ ${p.price} / ${p.unit}, De: ${p.oldPrice ? `R$ ${p.oldPrice}` : 'Não aplicável'}, Descrição: ${p.description || 'Nenhuma'}`
        ).join('\n---\n');

        const prompt = `Crie um roteiro de locução (apenas áudio) curto e direto (máximo 30 segundos) para as seguintes ofertas em Português (Brasil). O texto deve ser contínuo, sem marcadores de cena ou formatação de vídeo, e incluir uma chamada para ação clara no final.

        Detalhes dos Produtos:
        ${productDetails}

        Gere a resposta em formato JSON, seguindo exatamente o schema fornecido.

        Schema JSON:
        {
          "headline": "Frase de impacto curta para o anúncio",
          "script": "O texto completo da locução, em um único parágrafo ou com quebras de linha simples para leitura.",
          "suggestions": {
            "music": "Sugestão de estilo musical (ex: Jingle animado, Música de suspense)",
            "voice": "Sugestão de estilo de voz do locutor (ex: Entusiasmado e rápido, Calmo e persuasivo)"
          }
        }`;
        
        const chatResponse = await callOpenAI('chat/completions', apiKey, {
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.5,
        });
        
        const jsonContent = chatResponse.choices[0].message.content;
        
        try {
            result = { text: jsonContent };
        } catch (e) {
            result = { text: jsonContent };
        }
        break;
      }
    }
    
    // Retorna o resultado do chat/imagem
    return new Response(JSON.stringify({ response: result }), {
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