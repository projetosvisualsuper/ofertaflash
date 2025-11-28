import { Product, PosterTheme, PosterFormat, HeaderAndFooterElements } from '../types';

export const POSTER_FORMATS: PosterFormat[] = [
  { id: 'story', name: 'Story / TikTok', aspectRatio: '1080 / 1920', width: 1080, height: 1920, label: '9:16', icon: '📱' },
  { id: 'feed', name: 'Instagram / Quadrado', aspectRatio: '1080 / 1080', width: 1080, height: 1080, label: '1:1', icon: '🟦' },
  { id: 'a4', name: 'Folha A4 / Cartaz', aspectRatio: '2480 / 3508', width: 2480, height: 3508, label: 'A4', icon: '📄' },
  { id: 'landscape-poster', name: 'Cartaz Paisagem', aspectRatio: '1920 / 1080', width: 1920, height: 1080, label: '16:9', icon: '🖼️' },
  { id: 'tv', name: 'TV / Slides', aspectRatio: '1920 / 1080', width: 1920, height: 1080, label: '16:9', icon: '📺' },
];

const defaultLayout = {
  image: { x: 0, y: 0, scale: 1 },
  name: { x: 0, y: 0, scale: 1 },
  price: { x: 0, y: 0, scale: 1 },
  description: { x: 0, y: 0, scale: 1 },
};

const defaultHeaderElements: HeaderAndFooterElements = {
  headerTitle: { text: 'SUPER OFERTAS', x: 0, y: 0, scale: 1 },
  headerSubtitle: { text: 'SÓ HOJE', x: 0, y: 0, scale: 1 },
  footerText: { text: 'Ofertas válidas enquanto durarem os estoques', x: 0, y: 0, scale: 1 },
};

const createInitialLayouts = () => ({
  'story': JSON.parse(JSON.stringify(defaultLayout)),
  'feed': JSON.parse(JSON.stringify(defaultLayout)),
  'a4': JSON.parse(JSON.stringify(defaultLayout)),
  'landscape-poster': JSON.parse(JSON.stringify(defaultLayout)),
  'tv': JSON.parse(JSON.stringify(defaultLayout)),
});

const createInitialHeaderElements = (): Record<string, HeaderAndFooterElements> => ({
  'story': JSON.parse(JSON.stringify(defaultHeaderElements)),
  'feed': JSON.parse(JSON.stringify(defaultHeaderElements)),
  'a4': JSON.parse(JSON.stringify(defaultHeaderElements)),
  'landscape-poster': JSON.parse(JSON.stringify(defaultHeaderElements)),
  'tv': JSON.parse(JSON.stringify(defaultHeaderElements)),
});

export const INITIAL_THEME: PosterTheme = {
  primaryColor: '#dc2626',
  secondaryColor: '#fbbf24',
  backgroundColor: '#ffffff',
  textColor: '#1a1a1a',
  headerTextColor: '#ffffff',
  layoutCols: {
    'story': 2,
    'feed': 2,
    'a4': 2,
    'landscape-poster': 3,
    'tv': 3,
  },
  format: POSTER_FORMATS[2],
  priceCardStyle: 'default',
  priceCardBackgroundColor: '#ffffff',
  priceCardTextColor: '#dc2626',
  headerLayoutId: 'text-only',
  headerArtStyleId: 'block',
  fontFamilyDisplay: 'Oswald, sans-serif',
  fontFamilyBody: 'Inter, sans-serif',
  headerTitleCase: 'uppercase',
  hasFrame: false,
  frameColor: '#fbbf24',
  frameThickness: 1.5,
  unitBottomEm: -0.5, 
  unitRightEm: -1.5,
  headerImage: undefined,
  headerImageMode: 'none',
  useLogoOnHero: false,
  headerImageOpacity: 0.3,
  headerElements: createInitialHeaderElements(),
};

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Leite Integral 1L', description: 'Leite fresco e puro, ideal para toda a família.', price: '4.99', oldPrice: '6.50', unit: 'un', layouts: createInitialLayouts() },
  { id: '2', name: 'Arroz Branco 5kg', description: 'Tipo 1, grãos selecionados.', price: '22.90', unit: 'un', layouts: createInitialLayouts() },
  { id: '3', name: 'Café Tradicional 500g', description: 'Torra média, sabor intenso.', price: '14.50', oldPrice: '18.90', unit: 'un', layouts: createInitialLayouts() },
];