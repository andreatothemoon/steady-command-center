import { type AccountType, type WrapperType } from "./types";

export interface MockAccount {
  id: string;
  name: string;
  provider: string;
  owner: string;
  type: AccountType;
  wrapper: WrapperType;
  value: number;
  lastUpdated: string;
  source: "manual" | "imported";
  confidence: "high" | "medium" | "low";
}

export interface MockCashFlow {
  id: string;
  date: string;
  type: string;
  description: string;
  amount: number;
  accountId: string;
  tag: string;
}

export const mockAccounts: MockAccount[] = [
  { id: "1", name: "Current Account", provider: "Monzo", owner: "You", type: "current_account", wrapper: "none", value: 4250, lastUpdated: "2026-04-01", source: "manual", confidence: "high" },
  { id: "2", name: "Easy Access Saver", provider: "Marcus", owner: "You", type: "savings", wrapper: "none", value: 18500, lastUpdated: "2026-03-28", source: "manual", confidence: "high" },
  { id: "3", name: "Cash ISA", provider: "Chip", owner: "You", type: "cash_isa", wrapper: "isa", value: 12000, lastUpdated: "2026-04-01", source: "manual", confidence: "high" },
  { id: "4", name: "S&S ISA", provider: "Vanguard", owner: "You", type: "stocks_and_shares_isa", wrapper: "isa", value: 67400, lastUpdated: "2026-03-30", source: "imported", confidence: "high" },
  { id: "5", name: "S&S ISA", provider: "Hargreaves Lansdown", owner: "Partner", type: "stocks_and_shares_isa", wrapper: "isa", value: 42100, lastUpdated: "2026-03-29", source: "manual", confidence: "medium" },
  { id: "6", name: "SIPP", provider: "Vanguard", owner: "You", type: "sipp", wrapper: "sipp", value: 145000, lastUpdated: "2026-03-30", source: "imported", confidence: "high" },
  { id: "7", name: "Workplace Pension", provider: "Aviva", owner: "You", type: "workplace_pension", wrapper: "workplace_pension", value: 38200, lastUpdated: "2026-02-28", source: "manual", confidence: "medium" },
  { id: "8", name: "Workplace Pension", provider: "Scottish Widows", owner: "Partner", type: "workplace_pension", wrapper: "workplace_pension", value: 29500, lastUpdated: "2026-01-15", source: "manual", confidence: "low" },
  { id: "9", name: "DB Pension", provider: "NHS", owner: "Partner", type: "db_pension", wrapper: "db_pension", value: 0, lastUpdated: "2026-03-01", source: "manual", confidence: "medium" },
  { id: "10", name: "GIA", provider: "Trading 212", owner: "You", type: "gia", wrapper: "none", value: 8900, lastUpdated: "2026-04-01", source: "imported", confidence: "high" },
  { id: "11", name: "Mortgage", provider: "Nationwide", owner: "Joint", type: "mortgage", wrapper: "none", value: -215000, lastUpdated: "2026-03-01", source: "manual", confidence: "high" },
  { id: "12", name: "Property", provider: "—", owner: "Joint", type: "property", wrapper: "none", value: 385000, lastUpdated: "2026-01-01", source: "manual", confidence: "low" },
  { id: "13", name: "Bitcoin", provider: "Coinbase", owner: "You", type: "crypto", wrapper: "none", value: 5200, lastUpdated: "2026-04-02", source: "imported", confidence: "high" },
];

export const mockNetWorthHistory = [
  { month: "Oct 24", value: 468000 },
  { month: "Nov 24", value: 472000 },
  { month: "Dec 24", value: 478000 },
  { month: "Jan 25", value: 481000 },
  { month: "Feb 25", value: 489000 },
  { month: "Mar 25", value: 495000 },
  { month: "Apr 25", value: 498000 },
  { month: "May 25", value: 502000 },
  { month: "Jun 25", value: 508000 },
  { month: "Jul 25", value: 512000 },
  { month: "Aug 25", value: 518000 },
  { month: "Sep 25", value: 521000 },
  { month: "Oct 25", value: 525000 },
  { month: "Nov 25", value: 528000 },
  { month: "Dec 25", value: 530000 },
  { month: "Jan 26", value: 533000 },
  { month: "Feb 26", value: 536000 },
  { month: "Mar 26", value: 541050 },
];

export const mockContributions: MockCashFlow[] = [
  { id: "c1", date: "2026-04-01", type: "pension_employee", description: "Monthly pension contribution", amount: 450, accountId: "7", tag: "pension" },
  { id: "c2", date: "2026-04-01", type: "pension_employer", description: "Employer pension match", amount: 300, accountId: "7", tag: "pension" },
  { id: "c3", date: "2026-04-01", type: "isa_contribution", description: "Monthly ISA top-up", amount: 500, accountId: "4", tag: "isa" },
  { id: "c4", date: "2026-03-01", type: "pension_employee", description: "Monthly pension contribution", amount: 450, accountId: "7", tag: "pension" },
  { id: "c5", date: "2026-03-01", type: "pension_employer", description: "Employer pension match", amount: 300, accountId: "7", tag: "pension" },
  { id: "c6", date: "2026-03-01", type: "isa_contribution", description: "Monthly ISA top-up", amount: 500, accountId: "4", tag: "isa" },
  { id: "c7", date: "2026-02-15", type: "bonus", description: "Annual bonus into ISA", amount: 5000, accountId: "4", tag: "isa" },
  { id: "c8", date: "2026-03-15", type: "mortgage_overpayment", description: "Mortgage overpayment", amount: 2000, accountId: "11", tag: "mortgage" },
];
