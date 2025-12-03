import { HeaderTemplate } from '../../types';
import { POSTER_FORMATS } from '../state/initialState';

// Helper to create header elements for all formats
const createHeaderElementsForTemplate = (title: string, subtitle: string) => {
  const elements: Record<string, any> = {};
  POSTER_FORMATS.forEach(format => {
    elements[format.id] = {
      headerTitle: { text: title, x: 0, y: 0, scale: 1 },
      headerSubtitle: { text: subtitle, x: 0, y: 0, scale: 1 },
      footerText: { text: 'Ofertas válidas enquanto durarem os estoques', x: 0, y: 0, scale: 1 },
    };
  });
  return elements;
};


export const HEADER_TEMPLATE_PRESETS: HeaderTemplate[] = [
  {
    id: 'black-friday',
    name: 'Black Friday',
    thumbnail: 'https://i.imgur.com/8Q0Y4gZ.png', // Imagem de exemplo
    theme: {
      primaryColor: '#000000',
      secondaryColor: '#fcee21',
      headerTextColor: '#ffffff',
      fontFamilyDisplay: 'Anton, sans-serif',
      headerArtStyleId: 'slash',
      headerTitleCase: 'uppercase',
      headerElements: createHeaderElementsForTemplate('BLACK FRIDAY', 'IMPERDÍVEL'),
    },
  },
  {
    id: 'hortifruti',
    name: 'Feira Fresca',
    thumbnail: 'https://i.imgur.com/9X1W5hY.png', // Imagem de exemplo
    theme: {
      primaryColor: '#166534',
      secondaryColor: '#f97316',
      headerTextColor: '#ffffff',
      fontFamilyDisplay: "'Bebas Neue', cursive",
      headerArtStyleId: 'wave',
      headerTitleCase: 'uppercase',
      headerElements: createHeaderElementsForTemplate('HORTIFRUTI', 'Tudo Fresquinho'),
    },
  },
  {
    id: 'butcher-shop',
    name: 'Açougue do Chefe',
    thumbnail: 'https://i.imgur.com/7P2R6jX.png', // Imagem de exemplo
    theme: {
      primaryColor: '#b91c1c',
      secondaryColor: '#f7f2e9',
      headerTextColor: '#ffffff',
      fontFamilyDisplay: "'Alfa Slab One', cursive",
      headerArtStyleId: 'brush',
      headerTitleCase: 'uppercase',
      headerElements: createHeaderElementsForTemplate('AÇOUGUE', 'Carnes Nobres'),
      headerImage: 'https://www.transparenttextures.com/patterns/wood-pattern.png',
      headerImageMode: 'background',
      headerImageOpacity: 0.2,
    },
  },
  {
    id: 'bakery',
    name: 'Padaria Delícia',
    thumbnail: 'https://i.imgur.com/0Z3S7kL.png', // Imagem de exemplo
    theme: {
      primaryColor: '#78350f',
      secondaryColor: '#fde68a',
      headerTextColor: '#ffffff',
      fontFamilyDisplay: "'Lobster', cursive",
      headerArtStyleId: 'arc',
      headerTitleCase: 'capitalize',
      headerElements: createHeaderElementsForTemplate('Padaria & Confeitaria', 'Sabor de Casa'),
    },
  },
  {
    id: 'pink-week',
    name: 'Pink Week',
    thumbnail: 'https://i.imgur.com/1Y4T8mN.png', // Imagem de exemplo
    theme: {
      primaryColor: '#db2777',
      secondaryColor: '#fbcfe8',
      headerTextColor: '#ffffff',
      fontFamilyDisplay: "'Pacifico', cursive",
      headerArtStyleId: 'circles',
      headerTitleCase: 'capitalize',
      headerElements: createHeaderElementsForTemplate('Pink Week', 'Promoção Especial'),
    },
  },
  {
    id: 'tech-deals',
    name: 'Ofertas Tech',
    thumbnail: 'https://i.imgur.com/2Z5U9oP.png', // Imagem de exemplo
    theme: {
      primaryColor: '#1e3a8a',
      secondaryColor: '#0ea5e9',
      headerTextColor: '#ffffff',
      fontFamilyDisplay: "'Roboto Condensed', sans-serif",
      headerArtStyleId: 'steps',
      headerTitleCase: 'uppercase',
      headerElements: createHeaderElementsForTemplate('OFERTAS TECH', 'Conecte-se ao Futuro'),
    },
  },
];