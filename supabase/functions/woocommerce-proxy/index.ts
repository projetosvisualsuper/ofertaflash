import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// URL base do WooCommerce (deve ser configurada pelo usuário)
const WOOCOMMERCE_URL = Deno.env.get('WOOCOMMERCE_URL');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const consumerKey = Deno.env.get('WOOCOMMERCE_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET');
    
    if (!WOOCOMMERCE_URL || !consumerKey || !consumerSecret) {
      return new Response(JSON.stringify({ error: "WooCommerce secrets (URL, KEY, or SECRET) are not configured in Supabase Secrets." }), {
        status: 200, // Retorna 200 para que o frontend possa ler o corpo do erro
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Garante que a URL base termine com barra para a API
    let baseUrl = WOOCOMMERCE_URL.endsWith('/') ? WOOCOMMERCE_URL : WOOCOMMERCE_URL + '/';
    
    // Adiciona o endpoint da API REST
    if (!baseUrl.includes('/wp-json/')) {
        baseUrl = baseUrl + 'wp-json/wc/v3/';
    } else {
        // Se já tiver wp-json, garante que o v3 esteja lá
        baseUrl = baseUrl.replace(/wp-json\/wc\/v\d+\//, 'wp-json/wc/v3/');
    }
    
    const authQuery = `consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
    // ALTERAÇÃO AQUI: Removendo orderby=rand e usando orderby=date&order=desc
    const productsEndpoint = `${baseUrl}products?per_page=10&status=publish&orderby=date&order=desc&${authQuery}`;

    let response: Response;
    
    try {
        // Tenta fazer a requisição ao WooCommerce
        response = await fetch(productsEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'OfertaFlash-Supabase-Client/1.0',
            },
        });
    } catch (fetchError) {
        // Captura erros de rede, DNS ou SSL que impedem a conexão
        console.error("WooCommerce Fetch Network Error:", fetchError);
        return new Response(JSON.stringify({ 
            error: `Network/DNS Error: Failed to connect to WooCommerce URL (${WOOCOMMERCE_URL}). Check if the URL is correct and publicly accessible. Details: ${fetchError.message}` 
        }), {
            status: 200, // Retorna 200 para que o frontend possa ler o corpo do erro
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }


    if (!response.ok) {
        const errorStatus = response.status;
        let errorBody = `Status: ${errorStatus}`;
        
        try {
            const errorJson = await response.json();
            errorBody = errorJson.message || JSON.stringify(errorJson);
        } catch (e) {
            errorBody = await response.text();
        }
        
        console.error(`WooCommerce API Error: ${errorStatus} - ${errorBody}`);
        
        // Se for 401, adiciona a dica de permissão
        let userHint = '';
        if (errorStatus === 401) {
            userHint = ' (Verifique se as chaves têm permissão de Leitura e se estão corretas).';
        }
        
        return new Response(JSON.stringify({ 
            error: `WooCommerce API returned status ${errorStatus}. Details: ${errorBody}${userHint}` 
        }), {
            status: 200, // Retorna 200 para que o frontend possa ler o corpo do erro
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    
    const rawProducts = await response.json();
    
    // 3. Mapear e simplificar os dados para o frontend
    const wooProducts = rawProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        regular_price: p.regular_price,
        sale_price: p.sale_price,
        permalink: p.permalink,
        image_url: p.images.length > 0 ? p.images[0].src : null,
    }));

    return new Response(JSON.stringify({ products: wooProducts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in WooCommerce Edge Function:", error);
    return new Response(JSON.stringify({ error: `Internal Edge Function Error: ${error.message}` }), {
      status: 200, // Retorna 200 para que o frontend possa ler o corpo do erro
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});