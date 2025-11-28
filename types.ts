import { HeaderLayoutId } from "./src/config/headerLayoutPresets";
import { HeaderArtStyleId } from "./src/config/headerArtPresets";

export interface ProductLayout {
  image: { x: number; y: number; scale: number };
  name: { x: number; y: number; scale: number };
  price: { x: number; y: number; scale: number };
  description: { x: number; y: number; scale: number };
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
    scale: number;
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
  headerImageOpacity: number;
  // Armazena elementos de cabeçalho/rodapé por formato
  headerElements: Record<string, HeaderAndFooterElements>;
}

export interface AIGeneratedImage {
  mimeType: string;
  data: string;
}