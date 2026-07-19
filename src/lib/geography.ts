/**
 * Lightweight geographical classifier for accounts.
 * The schema does not store a country field yet, so we infer a region from
 * the account type and institution name. Defaults to United Kingdom for a
 * UK-focused household.
 */
import type { Account } from "@/hooks/useAccounts";

export type Region = "uk" | "us" | "europe" | "global" | "unknown";

export const REGION_META: Record<Region, { label: string; flag: string; color: string }> = {
  uk: { label: "United Kingdom", flag: "🇬🇧", color: "#4F8CFF" },
  us: { label: "United States", flag: "🇺🇸", color: "#efcb68" },
  europe: { label: "Europe", flag: "🇪🇺", color: "#895b1e" },
  global: { label: "Global", flag: "🌍", color: "#22C55E" },
  unknown: { label: "Unassigned", flag: "•", color: "#aeb7b3" },
};

const US_HINTS = ["interactive brokers", "fidelity international", "robinhood", "schwab", "e*trade", "vanguard us", " us ", "usd"];
const EU_HINTS = ["europe", "deutsche", "bnp", "ing ", "eur "];

export function accountRegion(a: Account & { institutions?: { name: string | null } | null }): Region {
  if (a.account_type === "crypto") return "global";
  const inst = (a.institutions?.name ?? "").toLowerCase();
  if (US_HINTS.some((h) => inst.includes(h.trim()))) return "us";
  if (EU_HINTS.some((h) => inst.includes(h.trim()))) return "europe";
  return "uk";
}
