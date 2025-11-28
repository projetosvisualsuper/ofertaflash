import { HeaderLayoutId } from "./src/config/headerLayoutPresets";
import { HeaderArtStyleId } from "./src/config/headerArtPresets";
import { SlideTransitionId } from "./src/config/slideTransitions"; // Novo Import

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

export interface SavedImage {
  id: string;
  dataUrl: string;
  formatName: string;
  timestamp: number;
  theme: PosterTheme; // Adicionando o tema completo
}

export interface PosterTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  backgroundImage?: string;
  layoutCols: Record<string, number>;
  format: PosterFormat;
  logo?: {
    src: string;
    layouts: Record<string, LogoLayout>;
  }
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
  unitBottomEm: number;
  unitRightEm: number;
  headerImage?: string;
  headerImageMode: HeaderImageMode;
  useLogoOnHero?: boolean;
  headerImageOpacity: number;
  // Armazena elementos de cabeçalho/rodapé por formato
  headerElements: Record<string, HeaderAndFooterElements>;
  slideTransitionId: SlideTransitionId; // Novo campo
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