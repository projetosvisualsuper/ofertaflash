import { PosterTheme } from '../types';

export interface ThemePreset {
  id: string;
  name: string;
  theme: Partial<PosterTheme>;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'classic-red',
    name: 'Clássico Vermelho',
    theme: {
      primaryColor: '#dc2626',
      secondaryColor: '#fbbf24',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      headerTextColor: '#ffffff',
      priceCardStyle: 'default',
      priceCardBackgroundColor: '#ffffff',
      priceCardTextColor: '#dc2626',
      fontFamilyDisplay: 'Oswald, sans-serif',
      fontFamilyBody: 'Inter, sans-serif',
    },
  },
  {
    id: 'modern-blue',
    name: 'Moderno Azul',
    theme: {
      primaryColor: '#2563eb',
      secondaryColor: '#10b981',
      backgroundColor: '#f9fafb',
      textColor: '#111827',
      headerTextColor: '#ffffff',
      priceCardStyle: 'minimal',
      priceCardBackgroundColor: 'transparent',
      priceCardTextColor: '#2563eb',
      fontFamilyDisplay: 'Roboto Condensed, sans-serif',
      fontFamilyBody: 'Inter, sans-serif',
    },
  },
  {
    id: 'impact-yellow',
    name: 'Impacto Amarelo',
    theme: {
      primaryColor: '#000000',
      secondaryColor: '#facc15', // yellow-400
      backgroundColor: '#f3f4f6', // gray-200
      textColor: '#000000',
      headerTextColor: '#000000',
      priceCardStyle: 'pill',
      priceCardBackgroundColor: '#000000',
      priceCardTextColor: '#facc15',
      fontFamilyDisplay: 'Anton, sans-serif',
      fontFamilyBody: 'Roboto Condensed, sans-serif',
    },
  },
  {
    id: 'fresh-natural',
    name: 'Fresco Natural',
    theme: {
      primaryColor: '#166534', // green-800
      secondaryColor: '#f97316', // orange-500
      backgroundColor: '#f0fdf4', // green-50
      textColor: '#14532d', // green-900
      headerTextColor: '#ffffff',
      priceCardStyle: 'default',
      priceCardBackgroundColor: '#ffffff',
      priceCardTextColor: '#166534',
      fontFamilyDisplay: 'Bebas Neue, cursive',
      fontFamilyBody: 'Inter, sans-serif',
    },
  },
  {
    id: 'elegant-dark',
    name: 'Elegante Escuro',
    theme: {
      primaryColor: '#1f2937',
      secondaryColor: '#d97706',
      backgroundColor: '#111827',
      textColor: '#f9fafb',
      headerTextColor: '#f9fafb',
      priceCardStyle: 'pill',
      priceCardBackgroundColor: '#374151',
      priceCardTextColor: '#f59e0b',
      fontFamilyDisplay: 'Roboto Condensed, sans-serif',
      fontFamilyBody: 'Inter, sans-serif',
    },
  },
];