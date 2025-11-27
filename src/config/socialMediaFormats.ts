import { POSTER_FORMATS } from '../state/initialState';
import { PosterFormat } from '../../types';

export const SOCIAL_MEDIA_FORMATS: PosterFormat[] = POSTER_FORMATS.filter(f => 
  f.id === 'story' || f.id === 'feed'
);