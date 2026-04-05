export function normalizeRate(value: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.abs(numeric) > 1 ? numeric / 100 : numeric;
}

export function denormalizeRateForDisplay(value: number): number {
  return normalizeRate(value) * 100;
}
