import { Square, Circle, Minus, Zap, Heart, Star } from 'lucide-react';

export const FRAME_STYLE_PRESETS = [
  {
    id: 'solid',
    name: 'Sólida',
    icon: Square,
  },
  {
    id: 'dashed',
    name: 'Tracejada',
    icon: Minus,
  },
  {
    id: 'rounded',
    name: 'Arredondada',
    icon: Circle,
  },
  {
    id: 'star',
    name: 'Estrelas',
    icon: Star,
  },
  {
    id: 'heart',
    name: 'Corações',
    icon: Heart,
  },
  {
    id: 'none',
    name: 'Nenhuma',
    icon: Zap,
  },
] as const;

export type FrameStyleId = typeof FRAME_STYLE_PRESETS[number]['id'];