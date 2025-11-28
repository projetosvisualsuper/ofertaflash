import { Square, Scissors, Waves, Mountain, Orbit, Signal, Brush, Circle } from 'lucide-react';

export const HEADER_ART_PRESETS = [
  {
    id: 'block',
    name: 'Bloco',
    icon: Square,
  },
  {
    id: 'slash',
    name: 'Diagonal',
    icon: Scissors,
  },
  {
    id: 'wave',
    name: 'Onda',
    icon: Waves,
  },
  {
    id: 'peak',
    name: 'Pico',
    icon: Mountain,
  },
  {
    id: 'arc',
    name: 'Arco',
    icon: Orbit,
  },
  {
    id: 'steps',
    name: 'Degraus',
    icon: Signal,
  },
  {
    id: 'brush',
    name: 'Pincelada',
    icon: Brush,
  },
  {
    id: 'circles',
    name: 'Círculos',
    icon: Circle,
  },
] as const; // Use "as const" for stricter typing

export type HeaderArtStyleId = typeof HEADER_ART_PRESETS[number]['id'];