import { useMemo } from "react";
import { motion } from "framer-motion";
import { useAccounts } from "@/hooks/useAccounts";
import { useHouseholdProfiles } from "@/hooks/useHouseholdProfiles";
import { useTaxSummaries, computeANI, summaryToForm } from "@/hooks/useTaxSummaries";
import { useDBPensions } from "@/hooks/useDBPensions";
import { useSelectedRetirementScenario } from "@/hooks/useRetirementScenarios";
import { toDBPensionParams } from "@/lib/dbPensionRates";
import {
  computeRetirement,
  DEFAULT_LONGEVITY,
  DEFAULT_TAX_FREE_CASH_PCT,
  STATE_PENSION_AGE,
  type OtherIncomeSource,
  type RetirementInputs,
} from "@/lib/retirementEngine";
import type { DBPensionParams } from "@/lib/dbPensionEngine";
import IncomeTimeline from "@/components/retirement/IncomeTimeline";
import ReadinessCard from "@/components/home/ReadinessCard";
import GuaranteedIncomeCard from "@/components/home/GuaranteedIncomeCard";
import BridgeGapCard from "@/components/home/BridgeGapCard";
import TopActionsCard from "@/components/home/TopActionsCard";
import AccountsStackCard from "@/components/home/AccountsStackCard";
import DoMoreCard from "@/components/home/DoMoreCard";
import QuickActionsRow from "@/components/home/QuickActionsRow";
import type { MemberANI } from "@/types/tax";
import { formatCurrency } from "@/lib/format";
import { BarChart3 } from "lucide-react";

import { CURRENT_TAX_YEAR } from "@/lib/constants";
import { heroStagger as stagger } from "@/lib/animation";

function buildOtherIncomeSources(scenario: {
  retirement_age: number;
  isa_bridge_income_annual?: number;
  property_income_annual?: number;
  part_time_income_annual?: number;
}): OtherIncomeSource[] {
  const bridgeEndAge = Math.max(scenario.retirement_age, STATE_PENSION_AGE - 1);
  const isaBridgeIncome =
    "isa_bridge_income_annual" in scenario ? Number(scenario.isa_bridge_income_annual ?? 0) : 0;
  const propertyIncome =
    "property_income_annual" in scenario ? Number(scenario.property_income_annual ?? 0) : 0;
  const partTimeIncome =
    "part_time_income_annual" in scenario ? Number(scenario.part_time_income_annual ?? 0) : 0;

  return [
    { id: "isa_bridge", label: "ISA bridge", annualAmount: scenario.retirement_age < STATE_PENSION_AGE ? isaBridgeIncome : 0, startAge: scenario.retirement_age, endAge: bridgeEndAge },
    { id: "property", label: "Property income", annualAmount: propertyIncome, startAge: scenario.retirement_age, endAge: DEFAULT_LONGEVITY },
    { id: "part_time", label: "Part-time work", annualAmount: scenario.retirement_age < STATE_PENSION_AGE ? partTimeIncome : 0, startAge: scenario.retirement_age, endAge: bridgeEndAge },
  ];
}

export default function HomePage() {
  const { data: accounts = [] } = useAccounts();
  const { data: profiles = [] } = useHouseholdProfiles();
  const { data: taxSummaries = [] } = useTaxSummaries(CURRENT_TAX_YEAR);
  const { data: dbPensions = [] } = useDBPensions();

  const adults = profiles.filter((p) => p.role === "adult");

  const memberANIs: MemberANI[] = adults.map((p) => {
    const summary = taxSummaries.find((s) => s.member_profile_id === p.id);
    const form = summaryToForm(summary);
    const computed = computeANI(form);
    return { name: p.name, ani: computed.adjusted_net_income, pensionContributions: computed.pension_contributions };
  });

  const householdIsaUsed = taxSummaries.reduce((sum, s) => sum + Number(s.isa_contributions ?? 0), 0);
  const isaLimit = adults.length > 0 ? adults.length * 20000 : 20000;

  const { scenario } = useSelectedRetirementScenario();

  const dbPensionParams: DBPensionParams[] = useMemo(
    () => dbPensions.map((p) => toDBPensionParams(p)),
    [dbPensions],
  );

  const totalIsaPot = useMemo(
    () =>
      accounts
        .filter((a) => a.account_type === "cash_isa" || a.account_type === "stocks_and_shares_isa")
        .reduce((sum, a) => sum + Number(a.current_value), 0),
    [accounts],
  );

  const projection = useMemo(() => {
    if (!scenario) return null;
    const inputs: RetirementInputs = {
      currentAge: scenario.current_age,
      retireAge: scenario.retirement_age,
      currentPot: Number(scenario.current_pot),
      monthlyContrib: Number(scenario.monthly_contribution),
      employerContrib: Number(scenario.employer_contribution),
      expectedReturn: Number(scenario.expected_return),
      inflation: Number(scenario.inflation_rate),
      targetIncome: Number(scenario.target_income),
      statePensionPct: 100,
      drawdownRate: 0.04,
      taxFreeCashEnabled: "tax_free_cash_enabled" in scenario ? Boolean(scenario.tax_free_cash_enabled) : true,
      taxFreeCashPct: "tax_free_cash_pct" in scenario ? Number(scenario.tax_free_cash_pct) : DEFAULT_TAX_FREE_CASH_PCT,
      taxFreeCashAge:
        "tax_free_cash_age" in scenario && scenario.tax_free_cash_age != null
          ? Number(scenario.tax_free_cash_age)
          : scenario.retirement_age,
      isaPot: totalIsaPot,
      isaDrawdownRate: 0.04,
      isaGrowthRate: Number(scenario.expected_return),
      otherIncomeSources: buildOtherIncomeSources(scenario),
    };
    return { result: computeRetirement(inputs, dbPensionParams), inputs };
  }, [scenario, dbPensionParams, totalIsaPot]);

  const netWorth = useMemo(
    () => accounts.reduce((s, a) => s + Number(a.current_value), 0),
    [accounts],
  );

  const monthlyIncome = projection ? Math.round(projection.result.totalIncome / 12) : null;
  const retireAge = scenario?.retirement_age ?? 57;
  const targetIncome = scenario ? Number(scenario.target_income) : 30000;
  const monthlyTarget = Math.round(targetIncome / 12);

  return (
    <motion.div className="flex flex-col gap-10" variants={stagger.container} initial="initial" animate="animate">
      {/* HERO: total balance + quick actions + stacked account cards (Wise-inspired) */}
      <motion.section variants={stagger.item} className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Total wealth</p>
            <div className="mt-1 flex items-end gap-3">
              <h1 className="text-[2.5rem] font-semibold tracking-tight text-foreground sm:text-[2.75rem]">
                {formatCurrency(netWorth)}
              </h1>
              <button
                aria-label="View wealth history"
                className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-secondary/70 text-foreground transition-colors hover:bg-secondary"
              >
                <BarChart3 className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Across {accounts.length} account{accounts.length === 1 ? "" : "s"} · {adults.map((a) => a.name).join(" & ") || "your household"}
            </p>
          </div>

          <QuickActionsRow />

          <div className="grid grid-cols-1 gap-6 pt-4 sm:grid-cols-2">
            <AccountsStackCard accounts={accounts} netWorth={netWorth} />
            <DoMoreCard />
          </div>
        </div>

        {/* Right column: plan snapshot (smaller typography than before) */}
        <div className="card-surface flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Retirement plan</p>
            <span className="rounded-full bg-secondary/80 px-2.5 py-1 text-[11px] font-semibold text-foreground">
              Age {retireAge}
            </span>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Projected monthly income</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              {monthlyIncome !== null ? formatCurrency(monthlyIncome) : "—"}
              <span className="ml-1 text-sm font-medium text-muted-foreground">/mo</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-secondary/60 px-3 py-2.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Target</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{formatCurrency(monthlyTarget)}/mo</p>
            </div>
            <div className="rounded-2xl bg-secondary/60 px-3 py-2.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Readiness</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {projection ? `${projection.result.readinessPct}%` : "—"}
              </p>
            </div>
          </div>

          {projection && (
            <div className="rounded-2xl bg-secondary/50 px-4 py-3">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress to goal</span>
                <span className="font-semibold text-foreground">{projection.result.readinessPct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-background/80">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(projection.result.readinessPct, 100)}%` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {/* Retirement plan cards — smaller figures */}
      <motion.section variants={stagger.item} className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <ReadinessCard projection={projection?.result ?? null} retireAge={retireAge} />
        <GuaranteedIncomeCard projection={projection?.result ?? null} />
        <BridgeGapCard retireAge={retireAge} />
      </motion.section>

      {projection && (
        <motion.section variants={stagger.item}>
          <IncomeTimeline timeline={projection.result.timeline} retireAge={retireAge} targetIncome={targetIncome} />
        </motion.section>
      )}

      {/* Recommended actions */}
      <motion.section variants={stagger.item} className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recommended actions</h3>
          <p className="text-sm text-muted-foreground">
            Highest-leverage next steps based on the latest tax, account, and retirement data.
          </p>
        </div>
        <TopActionsCard
          accounts={accounts}
          memberANIs={memberANIs}
          isaUsed={householdIsaUsed}
          isaLimit={isaLimit}
          showHeader={false}
        />
      </motion.section>
    </motion.div>
  );
}
