export interface Product {
  id: string;
  name: string;
  price: string;
  oldPrice?: string;
  unit: string;
  image?: string;
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
  // New properties for fine-tuning
  productNameSize?: number;
  priceCardSize?: number;
  imageRatio?: number; // Percentage of card height for the image
}

export interface AIGeneratedImage {
  mimeType: string;
  data: string;
}