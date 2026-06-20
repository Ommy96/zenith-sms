/**
 * Zenith Design Tokens
 *
 * Canonical scale values exported as constants. Components import from here
 * to keep arbitrary values out of the codebase. Visual values live in
 * `src/index.css` as CSS variables — this file mirrors the spec for
 * TypeScript-side use (chart configs, motion durations, etc.).
 */

export const space = {
  0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24,
  8: 32, 10: 40, 12: 48, 16: 64, 20: 80, 24: 96,
} as const;

export const radius = {
  sm: 6, md: 8, lg: 10, xl: 12, "2xl": 16, full: 9999,
} as const;

export const fontSize = {
  xs: 11, sm: 13, base: 14, md: 15, lg: 18, xl: 22,
  "2xl": 28, "3xl": 36, "4xl": 48,
} as const;

export const motion = {
  fast: 150,
  base: 200,
  slow: 300,
  ease: {
    out: "cubic-bezier(0.2, 0, 0, 1)",
    in: "cubic-bezier(0.4, 0, 1, 1)",
  },
} as const;

export const breakpoints = {
  sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1440,
} as const;

/** Page max content width (centered, with 32px gutters desktop / 16px mobile) */
export const PAGE_MAX_WIDTH = 1440;

/** Sidebar widths */
export const SIDEBAR_EXPANDED = 248;
export const SIDEBAR_COLLAPSED = 64;

/** Chart colors — read live from CSS vars in components when possible */
export const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
] as const;