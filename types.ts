export interface Product {
  id: string;
  name: string;
  price: string;
  oldPrice?: string;
  unit: string;
  image?: string;
  // NEW: Individual layout controls
  layout?: {
    image: { x: number; y: number; scale: number };
    name: { x: number; y: number; scale: number };
    price: { x: number; y: number; scale: number };
  }
}

export interface PosterFormat {
  id: string;
  name: string;
  aspectRatio: string; // Tailwind class or CSS value
  width: number; // For download resolution reference
  height: number;
  label: string;
  icon: string;
}

export interface PosterTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  headerTitle: string;
  headerSubtitle: string;
  footerText: string;
  backgroundImage?: string;
  layoutCols: number;
  format: PosterFormat;
}

export interface AIGeneratedImage {
  mimeType: string;
  data: string;
}