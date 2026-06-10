// ── Dark theme (default) ──────────────────────────────────────────────────────
const dark = {
  bgMain:      '#0a0d12',
  bgCard:      '#0f1318',
  bgInput:     '#151a22',
  bgHover:     '#1c2330',
  gold:        '#c8a84b',
  goldBright:  '#e8c96a',
  success:     '#2dd4a0',
  danger:      '#e25555',
  info:        '#5b9cf6',
  textPrimary: '#e8e4dc',
  textSec:     '#8a8a8a',
  textMuted:   '#555555',
  border:      'rgba(255,255,255,0.07)',
  borderMed:   'rgba(255,255,255,0.12)',
  borderGold:  'rgba(200,168,75,0.3)',
} as const;

// ── Light theme ───────────────────────────────────────────────────────────────
const light = {
  bgMain:      '#f0ede6',
  bgCard:      '#faf8f4',
  bgInput:     '#ffffff',
  bgHover:     '#f0ede6',
  gold:        '#a07830',
  goldBright:  '#c8a84b',
  success:     '#1a9e76',
  danger:      '#c93030',
  info:        '#2a6ec8',
  textPrimary: '#1a1a1a',
  textSec:     '#555555',
  textMuted:   '#888888',
  border:      'rgba(0,0,0,0.1)',
  borderMed:   'rgba(0,0,0,0.15)',
  borderGold:  'rgba(160,120,48,0.4)',
} as const;

// ── Active theme (reactive) ───────────────────────────────────────────────────
function getTheme() {
  if (typeof window === 'undefined') return dark;
  return document.documentElement.getAttribute('data-theme') === 'light' ? light : dark;
}

// Proxy that always reads current theme
export const C = new Proxy({} as typeof dark, {
  get(_: any, key: string) {
    return getTheme()[key as keyof typeof dark];
  },
}) as typeof dark;

export const FONTS = {
  arabic:  "'IBM Plex Sans Arabic', sans-serif",
  mono:    "'IBM Plex Mono', monospace",
  display: "'Playfair Display', serif",
} as const;

// Helper to apply theme globally
export function applyThemeToDOM(theme: 'dark' | 'light') {
  const t = theme === 'light' ? light : dark;
  document.documentElement.setAttribute('data-theme', theme);
  document.body.style.background    = t.bgMain;
  document.body.style.color         = t.textPrimary;

  // CSS variables for components that use them
  const root = document.documentElement;
  Object.entries(t).forEach(([key, val]) => {
    root.style.setProperty(`--c-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, val);
  });
}
