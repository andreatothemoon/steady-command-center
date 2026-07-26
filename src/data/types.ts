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
  | "property"
  | "loan"
  | "credit_card"
  // Investment structures
  | "foundation"
  | "pp_life"
  | "capital_participation"
  | "trust"
  // Alternative investments
  | "private_fund"
  | "venture_capital_direct"
  | "real_estate_open_end"
  | "hedge_fund_closed_end"
  | "private_equity_fund"
  | "real_estate_fund"
  | "venture_capital_fund_closed_end"
  // Collections
  | "antique"
  | "book"
  | "horse"
  | "jewelry"
  | "other_collectible"
  | "painting"
  | "photography"
  | "sculpture"
  | "watch"
  | "wine_cellar"
  // Motor vehicles
  | "airplane"
  | "automobile"
  | "helicopter"
  | "motorcycle"
  | "watercraft"
  | "yacht";

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
  loan: "Loan",
  credit_card: "Credit Card",
  foundation: "Foundation",
  pp_life: "PP-Life",
  capital_participation: "Capital Participation",
  trust: "Trust",
  private_fund: "Private Fund",
  venture_capital_direct: "Venture Capital (Direct)",
  real_estate_open_end: "Real Estate (Open-End)",
  hedge_fund_closed_end: "Hedge Fund (Closed-End)",
  private_equity_fund: "Private Equity Fund",
  real_estate_fund: "Real Estate Fund",
  venture_capital_fund_closed_end: "Venture Capital Fund (Closed-End)",
  antique: "Antique",
  book: "Book",
  horse: "Horse",
  jewelry: "Jewelry",
  other_collectible: "Other Collectible",
  painting: "Painting",
  photography: "Photography",
  sculpture: "Sculpture",
  watch: "Watch",
  wine_cellar: "Wine Cellar",
  airplane: "Airplane",
  automobile: "Automobile",
  helicopter: "Helicopter",
  motorcycle: "Motorcycle",
  watercraft: "Watercraft",
  yacht: "Yacht",
};

export const wrapperLabels: Record<WrapperType, string> = {
  none: "Unwrapped",
  isa: "ISA",
  sipp: "SIPP",
  workplace_pension: "Workplace Pension",
  db_pension: "DB Pension",
};

/**
 * Groups for the account-type picker. Order defines display order in the
 * grouped Select; each type appears in exactly one group.
 */
export const accountTypeGroups: { label: string; types: AccountType[] }[] = [
  {
    label: "Cash & Banking",
    types: ["current_account", "savings"],
  },
  {
    label: "Investments",
    types: ["cash_isa", "stocks_and_shares_isa", "gia", "crypto", "employer_share_scheme"],
  },
  {
    label: "Pensions",
    types: ["sipp", "workplace_pension", "db_pension"],
  },
  {
    label: "Property & Debt",
    types: ["property", "mortgage", "loan", "credit_card"],
  },
  {
    label: "Investment Structures",
    types: ["foundation", "pp_life", "capital_participation", "trust"],
  },
  {
    label: "Alternative Investments",
    types: [
      "private_fund",
      "venture_capital_direct",
      "real_estate_open_end",
      "hedge_fund_closed_end",
      "private_equity_fund",
      "real_estate_fund",
      "venture_capital_fund_closed_end",
    ],
  },
  {
    label: "Collections",
    types: [
      "antique",
      "book",
      "horse",
      "jewelry",
      "painting",
      "photography",
      "sculpture",
      "watch",
      "wine_cellar",
      "other_collectible",
    ],
  },
  {
    label: "Motor Vehicles",
    types: ["airplane", "automobile", "helicopter", "motorcycle", "watercraft", "yacht"],
  },
];
