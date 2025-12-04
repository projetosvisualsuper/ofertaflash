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
      // Retorna um erro 400 com uma mensagem clara para o frontend
      return new Response(JSON.stringify({ error: "WooCommerce secrets (URL, KEY, or SECRET) are not configured." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // 1. Construir a URL de autenticação básica
    // Usamos a autenticação básica via URL para a API REST do WooCommerce
    const authQuery = `consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
    
    // 2. Endpoint para buscar produtos: 10 produtos aleatórios (orderby=rand)
    const productsEndpoint = `${WOOCOMMERCE_URL}/wp-json/wc/v3/products?per_page=10&status=publish&orderby=rand&${authQuery}`;

    const response = await fetch(productsEndpoint, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`WooCommerce API Error:`, response.status, errorText);
        // Lança um erro com o status e o corpo da resposta para ser capturado no frontend
        throw new Error(`WooCommerce API failed: ${response.status} - ${errorText}`);
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
    // Garante que o erro interno seja retornado como 500
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});