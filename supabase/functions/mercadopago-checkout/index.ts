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

  try {
    console.log("MP Checkout: Starting request processing.");
    
    // Lendo segredos dentro do handler
    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!MERCADOPAGO_ACCESS_TOKEN) {
      const errorMsg = "MERCADOPAGO_ACCESS_TOKEN is not configured in Supabase Secrets.";
      console.error("MP Checkout Error:", errorMsg);
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 200, // Retorna 200 para que o frontend possa ler o corpo do erro
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        const errorMsg = "Supabase URL or Service Role Key is missing in Edge Function environment.";
        console.error("MP Checkout Error:", errorMsg);
        return new Response(JSON.stringify({ error: errorMsg }), {
            status: 200, // Retorna 200 para que o frontend possa ler o corpo do erro
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    
    // 1. Criar cliente Admin para buscar dados da tabela plan_configurations
    const supabaseAdmin = createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY
    );
    
    let planRole, userId, userEmail;
    try {
        const body = await req.json();
        planRole = body.planRole;
        userId = body.userId;
        userEmail = body.userEmail; // <-- LENDO O EMAIL DO USUÁRIO
        console.log(`MP Checkout: Received body - planRole: ${planRole}, userId: ${userId}, userEmail: ${userEmail}`);
    } catch (e) {
        console.error("MP Checkout Error: Failed to parse request body.", e);
        return new Response(JSON.stringify({ error: 'Invalid JSON body received.' }), { status: 200, headers: corsHeaders });
    }
    
    if (!planRole || !userId || !userEmail) {
        const errorMsg = 'Missing planRole, userId, or userEmail in request body';
        console.error("MP Checkout Error:", errorMsg);
        return new Response(JSON.stringify({ error: errorMsg }), { status: 200, headers: corsHeaders });
    }
    
    // 2. Buscar detalhes do plano no DB
    const { data: planConfig, error: planError } = await supabaseAdmin
        .from('plan_configurations')
        .select('name, price')
        .eq('role', planRole)
        .single();
        
    if (planError || !planConfig) {
        const errorMsg = `Plan configuration not found for role: ${planRole}`;
        console.error("MP Checkout Error:", errorMsg, planError);
        return new Response(JSON.stringify({ error: errorMsg }), { status: 200, headers: corsHeaders });
    }
    
    // 3. Extrair o preço (removendo R$, espaços e substituindo vírgula por ponto)
    const rawPriceString = planConfig.price.replace('R$', '').replace('/', '').replace('mês', '').trim();
    const priceMatch = rawPriceString.match(/[\d,.]+/);
    let priceValue = 0;
    
    if (priceMatch) {
        // Substitui vírgula por ponto e garante que seja um float
        priceValue = parseFloat(priceMatch[0].replace(',', '.'));
    }
    
    if (isNaN(priceValue) || priceValue <= 0) {
        const errorMsg = `Invalid price value found: ${planConfig.price}`;
        console.error("MP Checkout Error:", errorMsg);
        return new Response(JSON.stringify({ error: errorMsg }), { status: 200, headers: corsHeaders });
    }
    
    // Garante que o valor tenha duas casas decimais
    const transactionAmount = parseFloat(priceValue.toFixed(2));
    console.log(`MP Checkout: Plan found. Price: ${planConfig.price}, Transaction Amount: ${transactionAmount}`);
    
    // 4. Cria o payload da Preferência de Assinatura (Preapproval)
    const externalReference = `${userId}_${planRole}`;
    
    // URLs de retorno e notificação
    const backUrl = "https://criarofertas.vercel.app/#profile"; // Usando hash para garantir que o App React lide com o redirecionamento
    const notificationUrl = `https://cdktwczejznbqfzmizpu.supabase.co/functions/v1/mercadopago-webhook-handler`;
    
    const preapprovalPayload = {
        reason: `${planConfig.name} Criar Ofertas`,
        auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: transactionAmount, // Usando o valor formatado
            currency_id: "BRL",
        },
        payer_email: userEmail, // <-- ADICIONADO O EMAIL DO PAGADOR
        back_url: backUrl,
        external_reference: externalReference, 
        notification_url: notificationUrl,
    };
    
    console.log("MP Checkout: Sending Preapproval Payload:", JSON.stringify(preapprovalPayload));

    // 5. Chama a API do Mercado Pago para criar a preferência de assinatura
    const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(preapprovalPayload),
    });

    if (!mpResponse.ok) {
        // Tenta ler o corpo do erro do Mercado Pago
        let errorBody;
        try {
            errorBody = await mpResponse.json();
        } catch (e) {
            errorBody = { message: await mpResponse.text() };
        }
        
        const errorMsg = `Mercado Pago API failed (${mpResponse.status}): ${errorBody.message || 'Unknown error'}. Verifique o Access Token e as permissões.`;
        
        // NOVO: Loga o corpo completo do erro para o console do Supabase
        console.error("MP Checkout Error: Mercado Pago API failed:", mpResponse.status, JSON.stringify(errorBody));
        
        // Retorna o erro detalhado para o frontend
        return new Response(JSON.stringify({ 
            error: errorMsg,
            mpStatus: mpResponse.status, // Inclui o status do MP para debug
        }), {
            status: 200, // Retorna 200 para que o frontend possa ler o corpo do erro
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    
    const preapproval = await mpResponse.json();
    console.log("MP Checkout: Preapproval created successfully.");

    // 6. Retorna o link de checkout
    return new Response(JSON.stringify({ 
        checkoutLink: preapproval.init_point,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Captura qualquer erro de tempo de execução (ex: erro de rede, erro de sintaxe)
    console.error("MP Checkout Error: Internal Edge Function error:", error);
    return new Response(JSON.stringify({ error: `Internal Edge Function Error: ${error.message}` }), {
      status: 200, // Retorna 200 para que o frontend possa ler o corpo do erro
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});