// Core planning domain model — pages render these objects; engine produces them.

export type DecisionStatus = "considering" | "accepted" | "rejected";
export type EventStatus = "planned" | "confirmed" | "cancelled";

export type EventType =
  | "home_purchase"
  | "mortgage"
  | "child"
  | "marriage"
  | "salary_change"
  | "retirement"
  | "semi_retirement"
  | "business_acquisition"
  | "business_sale"
  | "inheritance"
  | "property_purchase"
  | "property_sale"
  | "rental_income"
  | "large_expense"
  | "investment_contribution"
  | "move_abroad"
  | "education"
  | "custom";

export type DecisionCategory =
  | "housing"
  | "career"
  | "family"
  | "business"
  | "lifestyle"
  | "retirement"
  | "investing"
  | "relocation";

export type FinancialEffectKind =
  | "cash_delta"
  | "recurring_income"
  | "recurring_expense"
  | "asset_delta"
  | "liability_delta"
  | "salary_delta"
  | "pension_contribution_delta";

export interface FinancialEffect {
  id: string;
  eventId: string;
  kind: FinancialEffectKind;
  amount: number; // GBP; negatives allowed
  frequency?: "monthly" | "annual" | "one_off";
  startYear: number;
  endYear?: number;
  label: string;
}

export interface PlanEvent {
  id: string;
  title: string;
  type: EventType;
  date: string; // ISO
  probability: number; // 0..1
  status: EventStatus;
  notes?: string;
  scenarioId: string;
  decisionId?: string;
  effects: FinancialEffect[];
}

export interface Decision {
  id: string;
  title: string;
  category: DecisionCategory;
  description: string;
  status: DecisionStatus;
  createdAt: string;
  notes?: string;
  eventIds: string[];
  expectedImpact?: string;
}

export type GoalPriority = "must" | "want" | "wish";
export type GoalConfidence = "high" | "on_track" | "at_risk" | "off_track";

export interface Goal {
  id: string;
  title: string;
  targetDate: string; // ISO year-month
  targetAmount?: number;
  priority: GoalPriority;
  progress: number; // 0..1
  confidence: GoalConfidence;
  estimatedCompletion?: string;
  dependencies?: string[];
  description?: string;
}

export interface ScenarioAssumptions {
  inflation: number; // 0.03
  investmentReturn: number; // 0.06
  savingsRate: number; // fraction of net income
  currentAge: number;
  targetRetirementAge: number;
  currentNetWorth: number;
  annualNetIncome: number;
  annualExpenses: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  assumptions: ScenarioAssumptions;
  eventIds: string[];
  decisionIds: string[];
  goalIds: string[];
  color?: string;
}

export interface Projection {
  scenarioId: string;
  fiYear: number;
  retirementYear: number;
  retirementMonthlyIncome: number;
  confidence: number; // 0..1
  netWorthAtRetirement: number;
  yearlyNetWorth: { year: number; value: number }[];
  successProbability: number; // 0..1
}

export type RecommendationCategory =
  | "pension"
  | "savings"
  | "tax"
  | "housing"
  | "career"
  | "investing";

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: string; // life-outcome phrasing
  confidence: number;
  priority: "low" | "medium" | "high";
  category: RecommendationCategory;
  nextAction?: { label: string; href?: string };
}

export interface ImpactSummary {
  fiYear: { before: number; after: number };
  retirementMonthlyIncome: { before: number; after: number };
  confidence: { before: number; after: number };
  headline: string;
  mitigation?: string;
}

export interface PlanState {
  scenarios: Scenario[];
  events: PlanEvent[];
  decisions: Decision[];
  goals: Goal[];
  activeScenarioId: string;
}
