import { Profile } from "../../types";

// Lista de todas as permissões disponíveis no sistema
export const PERMISSIONS = [
  'access_builder',
  'manage_products',
  'manage_company_info',
  'access_signage',
  'access_social_media',
  'access_ads',
  'access_settings',
  'view_reports',
  'manage_users',
  'manage_orders', // NOVO: Gerenciamento de Pedidos
  'access_admin_panel',
] as const;

export type Permission = typeof PERMISSIONS[number];

// Mapeamento de permissões padrão por Role (apenas como fallback, pois agora usamos plan_configurations)
export const DEFAULT_PERMISSIONS_BY_ROLE: Record<string, Permission[]> = {
  admin: [ 
    'access_builder', 'manage_products', 'manage_company_info', 'access_signage', 'access_social_media', 'access_ads', 'access_settings', 'view_reports', 'manage_users', 'manage_orders', 'access_admin_panel',
  ],
  pro: [ 
    'access_builder', 'manage_products', 'manage_company_info', 'access_signage', 'access_social_media', 'access_ads', 'access_settings', 'view_reports', 'manage_users', 'manage_orders',
  ],
  premium: [ 
    'access_builder', 'manage_products', 'manage_company_info', 'access_signage', 'access_social_media', // Removido 'access_ads'
  ],
  free: [ 
    'access_builder', 'access_social_media', 'manage_products',
  ],
};

// Mapeamento de Roles para exibição (apenas como fallback)
export const PLAN_NAMES: Record<string, string> = {
  admin: 'Administrador',
  pro: 'Plano Pro',
  premium: 'Plano Premium',
  free: 'Plano Grátis',
};

/**
 * Verifica se o perfil possui uma permissão específica.
 * @param profile O objeto Profile do usuário.
 * @param permission A permissão a ser verificada.
 * @returns true se o usuário tiver a permissão, false caso contrário.
 */
export const hasPermission = (profile: Profile | null, permission: Permission): boolean => {
  if (!profile) return false;
  // As permissões são armazenadas como um array de strings no campo 'permissions'
  return Array.isArray(profile.permissions) && profile.permissions.includes(permission);
};