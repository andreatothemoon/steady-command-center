export function normalizeRate(value: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  // Rates >= 1 are assumed to be percentages (e.g. 3 → 0.03)
  // Rates < 1 are assumed to be already decimal (e.g. 0.03)
  return Math.abs(numeric) >= 1 ? numeric / 100 : numeric;
}

export function denormalizeRateForDisplay(value: number): number {
  return normalizeRate(value) * 100;
}
