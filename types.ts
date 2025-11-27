import { HeaderLayoutId } from "./src/config/headerLayoutPresets";
import { HeaderArtStyleId } from "./src/config/headerArtPresets";

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
  oldPrice?: string;
  unit: string;
  image?: string;
  layout?: {
    image: { x: number; y: number; scale: number };
    name: { x: number; y: number; scale: number };
    price: { x: number; y: number; scale: number };
    description: { x: number; y: number; scale: number };
  }
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

export interface PosterTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  headerTitle: HeaderElement;
  headerSubtitle: HeaderElement;
  footerText: HeaderElement;
  backgroundImage?: string;
  layoutCols: number;
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
}

export interface AIGeneratedImage {
  mimeType: string;
  data: string;
}