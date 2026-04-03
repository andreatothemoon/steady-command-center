export type AccountType =
  | "current_account"
  | "savings"
  | "cash_isa"
  | "stocks_and_shares_isa"
  | "gia"
  | "sipp"
  | "workplace_pension"
  | "db_pension"
  | "mortgage"
  | "crypto"
  | "employer_share_scheme"
  | "property";

export type WrapperType =
  | "none"
  | "isa"
  | "sipp"
  | "workplace_pension"
  | "db_pension";

export const accountTypeLabels: Record<AccountType, string> = {
  current_account: "Current Account",
  savings: "Savings",
  cash_isa: "Cash ISA",
  stocks_and_shares_isa: "Stocks & Shares ISA",
  gia: "General Investment",
  sipp: "SIPP",
  workplace_pension: "Workplace Pension",
  db_pension: "DB Pension",
  mortgage: "Mortgage",
  crypto: "Crypto",
  employer_share_scheme: "Share Scheme",
  property: "Property",
};

export const wrapperLabels: Record<WrapperType, string> = {
  none: "Unwrapped",
  isa: "ISA",
  sipp: "SIPP",
  workplace_pension: "Workplace Pension",
  db_pension: "DB Pension",
};
