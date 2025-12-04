import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// O segredo do Mercado Pago para verificar a autenticidade do webhook
const MERCADOPAGO_WEBHOOK_SECRET = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET');
const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // 1. Verificar o token de autenticação do Webhook (Segurança)
  // O Mercado Pago geralmente envia um token no header 'x-signature' ou 'x-request-id'
  // Para simplificar, vamos usar um token secreto no header 'Authorization' ou 'x-mercadopago-token'
  const mpAuthHeader = req.headers.get('x-mercadopago-token');
  if (!mpAuthHeader || mpAuthHeader !== MERCADOPAGO_WEBHOOK_SECRET) {
    console.error("Webhook Error: Invalid Mercado Pago access token.");
    // Retorna 401 se o token não for válido
    return new Response(JSON.stringify({ error: 'Unauthorized webhook access' }), { status: 401, headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const topic = payload.topic || payload.type; // 'payment' ou 'subscription'
    const resourceUrl = payload.resource || payload.data?.id; // ID do recurso (pagamento ou assinatura)
    
    if (!resourceUrl || !topic) {
        console.warn("Webhook Warning: Missing topic or resource ID in payload.");
        return new Response(JSON.stringify({ received: true, message: "Missing topic or resource ID" }), { status: 200, headers: corsHeaders });
    }
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    let logMessage = `Event received: ${topic} for resource ${resourceUrl}`;
    let newRole = 'free';
    let userId = null;

    // 2. Buscar detalhes do pagamento/assinatura no Mercado Pago
    // Em um cenário real, você faria uma chamada à API do MP aqui usando MERCADOPAGO_ACCESS_TOKEN
    // Ex: const paymentDetails = await fetch(`https://api.mercadopago.com/v1/${topic}s/${resourceUrl}`, { headers: { Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` } });
    
    // SIMULAÇÃO: Para fins de demonstração, vamos simular a busca e extração do userId e status.
    // Assumimos que o Mercado Pago armazena o Supabase User ID no campo 'external_reference'
    
    // SIMULAÇÃO DE DADOS DO MP (Substitua pela chamada real à API do MP)
    const simulatedPaymentDetails = {
        status: 'approved', // approved, pending, cancelled, refunded
        external_reference: 'SUPABASE_USER_ID_EXAMPLE', // Onde o ID do usuário Supabase estaria
        metadata: {
            plan_role: 'premium' // Onde o plano (role) estaria
        }
    };
    
    // Extração simulada
    userId = simulatedPaymentDetails.external_reference;
    const paymentStatus = simulatedPaymentDetails.status;
    const planRole = simulatedPaymentDetails.metadata.plan_role;

    if (!userId || userId === 'SUPABASE_USER_ID_EXAMPLE') {
        console.warn("Webhook Warning: Could not extract valid Supabase User ID from external_reference.");
        return new Response(JSON.stringify({ received: true, message: "Missing or invalid User ID" }), { status: 200, headers: corsHeaders });
    }
    
    // 3. Processar Status de Pagamento
    if (paymentStatus === 'approved') {
        // Pagamento confirmado, faz upgrade para o plano pago
        newRole = planRole || 'premium'; // Assume premium se não houver role definido
        
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ role: newRole, updated_at: new Date().toISOString() })
            .eq('id', userId);
            
        if (updateError) throw updateError;
        logMessage = `User ${userId} upgraded to ${newRole} due to approved Mercado Pago payment.`;
        
    } else if (paymentStatus === 'cancelled' || paymentStatus === 'refunded') {
        // Pagamento falhou ou foi cancelado/reembolsado, faz downgrade para 'free'
        newRole = 'free';
        const { error: downgradeError } = await supabaseAdmin
            .from('profiles')
            .update({ role: newRole, updated_at: new Date().toISOString() })
            .eq('id', userId);
            
        if (downgradeError) throw downgradeError;
        logMessage = `User ${userId} downgraded to ${newRole} due to Mercado Pago payment status: ${paymentStatus}.`;
    } else {
        logMessage = `Ignored Mercado Pago status: ${paymentStatus}`;
    }

    console.log(logMessage);
    return new Response(JSON.stringify({ received: true, message: logMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error processing Mercado Pago webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});