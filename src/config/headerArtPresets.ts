import { Square, Scissors, Waves, Mountain } from 'lucide-react';

export const HEADER_ART_PRESETS = [
  {
    id: 'block',
    name: 'Bloco Moderno',
    icon: Square,
  },
  {
    id: 'slash',
    name: 'Corte Diagonal',
    icon: Scissors,
  },
  {
    id: 'wave',
    name: 'Onda Suave',
    icon: Waves,
  },
  {
    id: 'peak',
    name: 'Pico Geométrico',
    icon: Mountain,
  },
] as const;

export type HeaderArtStyleId = typeof HEADER_ART_PRESETS[number]['id'];