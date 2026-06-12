/**
 * Shared framer-motion stagger presets.
 * Replaces the variants that were previously duplicated across every page.
 */

/** Default vertical fade-up — used by Home (slightly larger movement). */
export const heroStagger = {
  container: { transition: { staggerChildren: 0.08 } },
  item: {
    initial: { opacity: 0, y: 14 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
  },
};

/** Standard vertical fade-up — used by most content pages. */
export const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  },
};

/** Horizontal slide-in — used by action lists. */
export const listStagger = {
  container: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
  item: {
    initial: { opacity: 0, x: -8 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
  },
};
