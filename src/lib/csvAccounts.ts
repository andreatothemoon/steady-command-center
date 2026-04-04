import type { Account } from "@/hooks/useAccounts";
import { accountTypeLabels, wrapperLabels } from "@/data/types";
import type { AccountType, WrapperType } from "@/data/types";

const EXPORT_COLUMNS = [
  "name",
  "account_type",
  "wrapper_type",
  "current_value",
  "owner_name",
  "interest_rate",
  "term_remaining_months",
] as const;

const HEADER = [
  "Name",
  "Account Type",
  "Wrapper",
  "Current Value",
  "Owner",
  "Interest Rate (%)",
  "Term Remaining (months)",
];

function escapeCsv(val: string): string {
  if (/[",\n\r]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
  return val;
}

export function exportAccountsCsv(accounts: Account[]): void {
  const rows = accounts.map((a) =>
    EXPORT_COLUMNS.map((col) => {
      const v = (a as any)[col];
      return v == null ? "" : String(v);
    })
  );
  const csv = [HEADER.join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `accounts_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ParsedRow {
  name: string;
  account_type: AccountType;
  wrapper_type: WrapperType;
  current_value: number;
  owner_name: string;
  interest_rate: number | null;
  term_remaining_months: number | null;
  _errors: string[];
}

const validAccountTypes = new Set(Object.keys(accountTypeLabels));
const validWrapperTypes = new Set(Object.keys(wrapperLabels));

// Try to reverse-map a label to its key (case-insensitive)
function resolveAccountType(raw: string): AccountType | null {
  const lower = raw.trim().toLowerCase();
  if (validAccountTypes.has(lower)) return lower as AccountType;
  const entry = Object.entries(accountTypeLabels).find(
    ([, label]) => label.toLowerCase() === lower
  );
  return entry ? (entry[0] as AccountType) : null;
}

function resolveWrapperType(raw: string): WrapperType | null {
  const lower = raw.trim().toLowerCase();
  if (validWrapperTypes.has(lower)) return lower as WrapperType;
  const entry = Object.entries(wrapperLabels).find(
    ([, label]) => label.toLowerCase() === lower
  );
  return entry ? (entry[0] as WrapperType) : null;
}

export function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Simple CSV parse (handles quoted fields)
  const parse = (line: string): string[] => {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQuotes = false;
        else cur += ch;
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === ",") { result.push(cur.trim()); cur = ""; }
        else cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const header = parse(lines[0]).map((h) => h.toLowerCase());

  // Map header to indices
  const nameIdx = header.findIndex((h) => h.includes("name") && !h.includes("owner"));
  const typeIdx = header.findIndex((h) => h.includes("type") && !h.includes("wrapper"));
  const wrapperIdx = header.findIndex((h) => h.includes("wrapper"));
  const valueIdx = header.findIndex((h) => h.includes("value") || h.includes("balance"));
  const ownerIdx = header.findIndex((h) => h.includes("owner"));
  const rateIdx = header.findIndex((h) => h.includes("interest") || h.includes("rate"));
  const termIdx = header.findIndex((h) => h.includes("term") || h.includes("remaining"));

  return lines.slice(1).map((line) => {
    const cols = parse(line);
    const errors: string[] = [];

    const name = nameIdx >= 0 ? cols[nameIdx] ?? "" : "";
    if (!name) errors.push("Missing name");

    const rawType = typeIdx >= 0 ? cols[typeIdx] ?? "" : "";
    const account_type = resolveAccountType(rawType);
    if (!account_type) errors.push(`Invalid type: "${rawType}"`);

    const rawWrapper = wrapperIdx >= 0 ? cols[wrapperIdx] ?? "" : "none";
    const wrapper_type = resolveWrapperType(rawWrapper || "none");
    if (!wrapper_type) errors.push(`Invalid wrapper: "${rawWrapper}"`);

    const rawValue = valueIdx >= 0 ? cols[valueIdx] ?? "0" : "0";
    const current_value = parseFloat(rawValue.replace(/[£$,]/g, ""));
    if (isNaN(current_value)) errors.push("Invalid value");

    const owner_name = ownerIdx >= 0 ? cols[ownerIdx] ?? "" : "";

    const rawRate = rateIdx >= 0 ? cols[rateIdx] ?? "" : "";
    const interest_rate = rawRate ? parseFloat(rawRate) : null;

    const rawTerm = termIdx >= 0 ? cols[termIdx] ?? "" : "";
    const term_remaining_months = rawTerm ? parseInt(rawTerm, 10) : null;

    return {
      name,
      account_type: account_type ?? ("savings" as AccountType),
      wrapper_type: wrapper_type ?? ("none" as WrapperType),
      current_value: isNaN(current_value) ? 0 : current_value,
      owner_name,
      interest_rate: interest_rate != null && !isNaN(interest_rate) ? interest_rate : null,
      term_remaining_months: term_remaining_months != null && !isNaN(term_remaining_months) ? term_remaining_months : null,
      _errors: errors,
    };
  });
}
