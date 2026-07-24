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

import WealthMapHeroTile from "@/components/home/pillars/WealthMapHeroTile";
import WealthChangeTile from "@/components/home/pillars/WealthChangeTile";
import PlanTrackTile from "@/components/home/pillars/PlanTrackTile";
import NextLifeEventTile from "@/components/home/pillars/NextLifeEventTile";
import AssetsBreakdownRow from "@/components/home/AssetsBreakdownRow";
import HouseholdWealthTile from "@/components/home/pillars/HouseholdWealthTile";
import RetirementTile from "@/components/home/pillars/RetirementTile";
import TaxTile from "@/components/home/pillars/TaxTile";
import type { MemberANI } from "@/types/tax";


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
    return computeRetirement(inputs, dbPensionParams);
  }, [scenario, dbPensionParams, totalIsaPot]);

  const netWorth = useMemo(
    () => accounts.reduce((s, a) => s + Number(a.current_value), 0),
    [accounts],
  );

  const retireAge = scenario?.retirement_age ?? 57;
  const targetIncome = scenario ? Number(scenario.target_income) : 30000;

  const householdName = adults.map((a) => a.name).join(" & ") || "your household";
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <motion.div className="flex flex-col gap-10" variants={stagger.container} initial="initial" animate="animate">
      {/* HERO — household greeting */}
      <motion.section variants={stagger.item} className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{greeting}</p>
        <h1 className="text-[2.5rem] font-semibold tracking-tight text-foreground sm:text-[2.75rem]">
          {householdName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {accounts.length} account{accounts.length === 1 ? "" : "s"} tracked
          {adults.length > 0 && ` · ${adults.length} adult${adults.length === 1 ? "" : "s"}`}
        </p>
      </motion.section>

      {/* LEVEL 1 — Wealth map hero + three side tiles */}
      <motion.section
        variants={stagger.item}
        className="grid grid-cols-1 gap-5 lg:grid-cols-4"
      >
        <div className="lg:col-span-3">
          <WealthMapHeroTile accounts={accounts} netWorth={netWorth} />
        </div>
        <div className="flex flex-col gap-5 lg:col-span-1">
          <WealthChangeTile />
          <PlanTrackTile projection={projection} scenarioName={scenario?.name ?? null} />
          <NextLifeEventTile />
        </div>
      </motion.section>

      {/* LEVEL 2 — Assets breakdown */}
      <motion.section variants={stagger.item}>
        <AssetsBreakdownRow accounts={accounts} />
      </motion.section>

      {/* LEVEL 3 — Tax · Retirement · Household */}
      <motion.section variants={stagger.item} className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <TaxTile memberANIs={memberANIs} isaUsed={householdIsaUsed} isaLimit={isaLimit} />
        <RetirementTile projection={projection} retireAge={retireAge} targetIncome={targetIncome} />
        <HouseholdWealthTile accounts={accounts} netWorth={netWorth} adults={adults} />
      </motion.section>
    </motion.div>
  );
}
