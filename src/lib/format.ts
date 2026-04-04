export function formatCurrency(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function daysAgo(dateStr: string): number {
  const now = new Date();
  const then = new Date(dateStr);
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

export function staleness(dateStr: string): "fresh" | "aging" | "stale" {
  const days = daysAgo(dateStr);
  if (days <= 7) return "fresh";
  if (days <= 30) return "aging";
  return "stale";
}

/** Standard amortising mortgage monthly payment: M = P·r(1+r)^n / ((1+r)^n − 1) */
export function calcMonthlyPayment(balance: number, annualRate: number, months: number): number | null {
  if (balance <= 0 || annualRate < 0 || months <= 0) return null;
  if (annualRate === 0) return balance / months;
  const r = annualRate / 100 / 12;
  const factor = Math.pow(1 + r, months);
  return (balance * r * factor) / (factor - 1);
}
