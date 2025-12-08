import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_URL = "https://api.openai.com/v1";

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
    let serviceKey = '';
    
    switch (task) {
      case 'generateMarketingCopy':
        serviceKey = 'generate_copy';
        break;
      case 'parseProductsFromText':
        serviceKey = 'parse_products';
        break;
      case 'generateAdScript':
        serviceKey = 'generate_ad_script';
        break;
      case 'generateBackgroundImage':
      case 'generateProductImage':
        serviceKey = 'generate_image';
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid task' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    
    // --- 1. BUSCAR CUSTO E VERIFICAR ADMIN ---
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // 1a. Obter o ID do usuário logado
    const supabaseAnon = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { 'Authorization': authHeader } } }
    );
    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser();
    if (userError || !user) throw new Error("User not authenticated.");
    
    // 1b. Verificar o role do usuário (usando a função de segurança)
    const { data: roleData } = await supabaseAdmin.rpc('get_my_role', {
        // Não precisa de argumentos, mas a função precisa ser chamada
    }).auth.session({ access_token: authHeader.replace('Bearer ', '') });
    
    const userRole = roleData || 'free';
    
    let creditCost = 0;
    let description = '';
    
    if (userRole !== 'admin') {
        // 1c. Buscar o custo dinamicamente
        const { data: costData, error: costError } = await supabaseAdmin
            .from('ai_costs')
            .select('cost, description')
            .eq('service_key', serviceKey)
            .single();
            
        if (costError || !costData) {
            console.warn(`AI Cost not found for ${serviceKey}. Using default 1.`);
            creditCost = 1; // Fallback
            description = `Consumo de 1 crédito (Fallback)`;
        } else {
            creditCost = costData.cost;
            description = costData.description;
        }
    }
    
    // --- 2. CONSUMIR CRÉDITOS (SE NÃO FOR ADMIN E O CUSTO FOR > 0) ---
    if (userRole !== 'admin' && creditCost > 0) {
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

    // --- 3. EXECUTAR TAREFA DE IA ---
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