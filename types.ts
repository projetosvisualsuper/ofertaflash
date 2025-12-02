import { HeaderLayoutId } from "./src/config/headerLayoutPresets";
import { HeaderArtStyleId } from "./src/config/headerArtPresets";
import { SlideTransitionId } from "./src/config/slideTransitions";
import { Permission } from "./src/config/constants"; // Novo Import
import { FrameStyleId } from "./src/config/frameStylePresets"; // NOVO IMPORT

export interface ProductLayout {
  image: { x: number; y: 0; scale: 1 };
  name: { x: 0, y: 0, scale: 1 };
  price: { x: 0, y: 0, scale: 1 };
  description: { x: 0, y: 0, scale: 1 };
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
  oldPrice?: string;
  unit: string;
  image?: string;
  layouts: Record<string, ProductLayout>; 
}

// Novo: Produto cadastrado no banco de dados local
export interface RegisteredProduct {
  id: string;
  name: string;
  description?: string;
  defaultPrice: string;
  defaultOldPrice?: string;
  defaultUnit: string;
  image?: string;
}

export interface PosterFormat {
  id: string;
  name: string;
  aspectRatio: string;
  width: number;
  height: number;
  label: string;
  icon: string;
}

export interface HeaderElement {
  text: string;
  x: number;
  y: number;
  scale: number;
}

export type HeaderImageMode = 'none' | 'background' | 'hero';

export interface HeaderAndFooterElements {
  headerTitle: HeaderElement;
  headerSubtitle: HeaderElement;
  footerText: HeaderElement;
}

export interface LogoLayout {
  scale: number;
  x: number;
  y: number;
}

export interface Logo {
  src: string;
  layouts: Record<string, LogoLayout>;
  path?: string; // Adicionado para rastrear o arquivo no Supabase Storage
}

export interface SavedImage {
  id: string;
  imageUrl: string; // Alterado de dataUrl para imageUrl
  storagePath: string; // Novo campo para rastrear o arquivo no Storage
  formatName: string;
  timestamp: number;
  theme: PosterTheme; // Adicionando o tema completo
}

export interface CompanyInfo {
  // Values
  name?: string;
  slogan?: string;
  phone?: string;
  whatsapp?: string;
  phonesLegend?: string;
  paymentMethods?: string;
  paymentNotes?: string;
  address?: string;
  instagram?: string;
  facebook?: string;
  website?: string;

  // Toggles
  showName?: boolean;
  showSlogan?: boolean;
  showPhone?: boolean;
  showWhatsapp?: boolean;
  showPhonesLegend?: boolean;
  showPaymentMethods?: boolean;
  showPaymentNotes?: boolean;
  showAddress?: boolean;
  showInstagram?: boolean;
  showFacebook?: boolean;
  showWebsite?: boolean;
}

export interface PosterTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  backgroundImage?: string;
  layoutCols: Record<string, number>;
  format: PosterFormat;
  logo?: Logo; // Usando a nova interface Logo
  priceCardStyle: 'default' | 'pill' | 'minimal';
  priceCardBackgroundColor: string;
  priceCardTextColor: string;
  headerLayoutId: HeaderLayoutId;
  headerArtStyleId: HeaderArtStyleId;
  fontFamilyDisplay: string;
  fontFamilyBody: string;
  headerTextColor: string;
  headerTitleCase: 'uppercase' | 'capitalize';
  hasFrame: boolean;
  frameColor: string;
  frameThickness: number;
  frameStyleId: FrameStyleId; // NOVO CAMPO
  unitBottomEm: number;
  unitRightEm: number;
  headerImage?: string;
  headerImageMode: HeaderImageMode;
  useLogoOnHero?: boolean;
  headerImageOpacity: number;
  // Armazena elementos de cabeçalho/rodapé por formato
  headerElements: Record<string, HeaderAndFooterElements>;
  slideTransitionId: SlideTransitionId; // Novo campo
  companyInfo?: CompanyInfo;
}

export interface AIGeneratedImage {
  mimeType: string;
  data: string;
}

export interface HeaderTemplate {
  id: string;
  name: string;
  thumbnail: string;
  theme: Partial<PosterTheme>;
}

// Estrutura para o roteiro de anúncio
export interface AdScript {
  headline: string;
  script: string;
  suggestions: {
    music: string;
    voice: string;
  };
}

// NOVO: Interface para o perfil do usuário
export interface Profile {
  id: string;
  username: string | null;
  role: string;
  permissions: Permission[];
  updated_at: string;
  deleted_at: string | null;
}

// NOVO: Interface para a visualização completa do admin
export interface AdminProfileView extends Profile {
  email: string | null;
  created_at: string;
}

// NOVO: Interface para Pedidos (Orders)
export interface Order {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'Pendente' | 'Em Progresso' | 'Concluído' | 'Cancelado';
  priority: 'Baixa' | 'Média' | 'Alta';
  assigned_to: string | null; // UUID do usuário atribuído
  order_number: string | null;
  entry_date: string | null;
  estimated_delivery_date: string | null;
  created_at: string;
  updated_at: string;
  // Propriedades de junção (não do DB, mas úteis no front)
  creator_username?: string;
  assigned_username?: string;
}