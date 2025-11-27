export const FONT_PRESETS = [
  {
    id: 'oswald',
    name: 'Impacto',
    fontFamily: 'Oswald, sans-serif',
  },
  {
    id: 'anton',
    name: 'Negrito',
    fontFamily: 'Anton, sans-serif',
  },
  {
    id: 'alfa-slab',
    name: 'Bloco',
    fontFamily: 'Alfa Slab One, cursive',
  },
  {
    id: 'bebas-neue',
    name: 'Alto',
    fontFamily: 'Bebas Neue, cursive',
  },
  {
    id: 'lobster',
    name: 'Cursiva',
    fontFamily: 'Lobster, cursive',
  },
  {
    id: 'pacifico',
    name: 'Manual',
    fontFamily: 'Pacifico, cursive',
  },
] as const;

export type FontPresetId = typeof FONT_PRESETS[number]['id'];