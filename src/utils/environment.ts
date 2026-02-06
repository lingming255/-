import { TimePhase } from '../types';
import { ColorTheme } from '../store/gameStore';

export const getTimePhase = (time: number): TimePhase => {
  if (time >= 5 && time < 10) return 'morning';
  if (time >= 10 && time < 16) return 'noon'; // Extended noon
  if (time >= 16 && time < 19) return 'dusk'; // Shortened afternoon/dusk
  if (time >= 19 && time < 20) return 'dusk'; 
  return 'night';
};

// Brighter, more distinct palettes per user request
export const getSkyGradient = (phase: TimePhase, weather: string, theme: ColorTheme = 'midnight'): string => {
  const isGloomy = weather === 'rain' || weather === 'snow' || weather === 'cloudy';

  if (isGloomy) {
    if (theme === 'bamboo') {
        // Gloomy Bamboo (Misty Green/Grey)
        switch (phase) {
          case 'morning': return 'linear-gradient(to top, #788585, #a3b8b8)'; 
          case 'noon': return 'linear-gradient(to top, #a3b8b8, #cce3e3)';
          case 'afternoon': return 'linear-gradient(to top, #788585, #a3b8b8)';
          case 'dusk': return 'linear-gradient(to top, #5c6b6b, #788585)'; 
          case 'night': return 'linear-gradient(to top, #1a2e2e, #2f4545)'; 
          default: return 'linear-gradient(to top, #2f4545, #4a6363)';
        }
    } else if (theme === 'sunset') {
        // Gloomy Sunset (Muted Brown/Red)
        switch (phase) {
          case 'morning': return 'linear-gradient(to top, #8f7e7e, #b8a3a3)'; 
          case 'noon': return 'linear-gradient(to top, #b8a3a3, #e3caca)';
          case 'afternoon': return 'linear-gradient(to top, #8f7e7e, #b8a3a3)';
          case 'dusk': return 'linear-gradient(to top, #6b5c5c, #8f7e7e)'; 
          case 'night': return 'linear-gradient(to top, #362424, #4d3333)'; 
          default: return 'linear-gradient(to top, #4d3333, #6b4d4d)';
        }
    }
    // Midnight (Default Slate)
    switch (phase) {
      case 'morning': return 'linear-gradient(to top, #94a3b8, #cbd5e1)'; // Slate 400-300
      case 'noon': return 'linear-gradient(to top, #cbd5e1, #e2e8f0)'; // Slate 300-200
      case 'afternoon': return 'linear-gradient(to top, #94a3b8, #cbd5e1)';
      case 'dusk': return 'linear-gradient(to top, #64748b, #94a3b8)'; // Slate 500-400
      case 'night': return 'linear-gradient(to top, #1e293b, #334155)'; // Slate 800-700 (Brighter night)
      default: return 'linear-gradient(to top, #334155, #475569)';
    }
  }

  // Clear weather - Brighter, more optimistic colors
  if (theme === 'bamboo') {
      // Bamboo Theme (Fresh Greens/Teals)
      switch (phase) {
        case 'morning': return 'linear-gradient(to top, #a7f3d0, #d1fae5)'; // Emerald 200-100
        case 'noon': return 'linear-gradient(to top, #6ee7b7, #a7f3d0)'; // Emerald 300-200
        case 'afternoon': return 'linear-gradient(to top, #34d399, #6ee7b7)'; // Emerald 400-300
        case 'dusk': return 'linear-gradient(to top, #fcd34d, #fca5a5)'; // Amber to Red (Warm Dusk)
        case 'night': return 'linear-gradient(to top, #064e3b, #065f46)'; // Emerald 950-900
        default: return 'linear-gradient(to top, #022c22, #064e3b)';
      }
  } else if (theme === 'sunset') {
      // Sunset Theme (Warm Reds/Oranges/Purples)
      switch (phase) {
        case 'morning': return 'linear-gradient(to top, #fed7aa, #ffedd5)'; // Orange 200-100
        case 'noon': return 'linear-gradient(to top, #fdba74, #fed7aa)'; // Orange 300-200
        case 'afternoon': return 'linear-gradient(to top, #fb923c, #fdba74)'; // Orange 400-300
        case 'dusk': return 'linear-gradient(to top, #ef4444, #7c2d12)'; // Red 500 -> Red 900
        case 'night': return 'linear-gradient(to top, #450a0a, #7f1d1d)'; // Red 950-900
        default: return 'linear-gradient(to top, #450a0a, #450a0a)';
      }
  }

  // Midnight (Default Blue/Indigo)
  switch (phase) {
    case 'morning': return 'linear-gradient(to top, #85b3cb, #aad9f2)'; // 200 -> 100
    case 'noon': return 'linear-gradient(to top, #aad9f2, #d1ffff)'; // 100 -> 50
    case 'afternoon': return 'linear-gradient(to top, #61909b, #85b3cb)'; // M300 -> 200
    case 'dusk': return 'linear-gradient(to top, #2E5A6F, #3e6d77)'; // 500 -> M400
    case 'night': return 'linear-gradient(to top, #000708, #001617)'; // S900 -> S800
    default: return 'linear-gradient(to top, #000708, #001617)';
  }
};
