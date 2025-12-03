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
  
  // 1. Autenticação e Verificação de Admin
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }
  
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token or user not found' }), { status: 401, headers: corsHeaders });
  }
  
  // Verifica se o usuário é admin (usando a tabela profiles)
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (profileError || profile?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Permission denied: Must be admin' }), { status: 403, headers: corsHeaders });
  }

  try {
    // 2. Buscar dados principais (admin_dashboard_stats)
    const { data: mainData, error: mainError } = await supabaseAdmin
      .from('admin_dashboard_stats')
      .select('*')
      .single();

    if (mainError && mainError.code !== 'PGRST116') throw mainError;
    
    // 3. Buscar uso de formatos (admin_format_usage_view)
    const { data: formatData, error: formatError } = await supabaseAdmin
      .from('admin_format_usage_view')
      .select('*');
      
    if (formatError) throw formatError;
    
    // 4. Buscar uso por plano (admin_plan_usage_view)
    const { data: planData, error: planError } = await supabaseAdmin
      .from('admin_plan_usage_view')
      .select('*');
      
    if (planError) throw planError;
    
    // 5. Buscar atividades recentes (Signups e Saved Arts)
    
    // 5a. Buscar os 5 usuários mais recentes (Signups)
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('admin_users_view')
      .select('id, email, username, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (usersError) throw usersError;

    const signupActivities = usersData.map(user => ({
      id: user.id,
      type: 'signup',
      description: `Novo cliente cadastrado: ${user.username || user.email}`,
      timestamp: user.created_at,
      user_id: user.id,
      details: user.email || undefined,
    }));
    
    // 5b. Buscar as 5 artes salvas mais recentes
    const { data: artsData, error: artsError } = await supabaseAdmin
      .from('saved_images')
      .select('id, created_at, format_name, user_id')
      .order('created_at', { ascending: false })
      .limit(5);

    if (artsError) throw artsError;

    // Cria um mapa de ID de usuário para username para referência rápida
    const userMap = new Map(usersData.map(user => [user.id, user.username || user.email]));

    const savedArtActivities = artsData.map(art => {
      const username = userMap.get(art.user_id) || 'Usuário Desconhecido';
      return {
        id: art.id,
        type: 'saved_art',
        description: `Arte salva (${art.format_name}) por ${username}`,
        timestamp: art.created_at,
        user_id: art.user_id,
        details: art.format_name,
      };
    });

    // 5c. Combinar e ordenar por timestamp
    const combinedActivities = [...signupActivities, ...savedArtActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    // 6. Retornar todos os dados em um único objeto
    return new Response(JSON.stringify({
      mainStats: mainData,
      formatUsage: formatData,
      planUsage: planData,
      recentActivities: combinedActivities,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error fetching admin reports:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});