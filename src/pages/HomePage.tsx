import { useMemo } from "react";
import { motion } from "framer-motion";
import { useAccounts } from "@/hooks/useAccounts";
import { useHouseholdProfiles } from "@/hooks/useHouseholdProfiles";
import { useTaxSummaries, computeANI, summaryToForm } from "@/hooks/useTaxSummaries";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDBPensions } from "@/hooks/useDBPensions";
import { projectDBPension } from "@/lib/dbPensionEngine";
import { toDBPensionParams } from "@/lib/dbPensionRates";
import { computeRetirement, UK_STATE_PENSION_FULL, STATE_PENSION_AGE, type RetirementInputs } from "@/lib/retirementEngine";
import type { DBPensionParams } from "@/lib/dbPensionEngine";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import IncomeTimeline from "@/components/retirement/IncomeTimeline";
import IncomeHeroCard from "@/components/home/IncomeHeroCard";
import WealthSummaryStrip from "@/components/home/WealthSummaryStrip";
import ReadinessCard from "@/components/home/ReadinessCard";
import TopActionsCard from "@/components/home/TopActionsCard";
import type { MemberANI } from "@/pages/OverviewPage";

const TAX_YEAR = "2025/26";

const stagger = {
  container: { transition: { staggerChildren: 0.08 } },
  item: {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
  },
};

export default function HomePage() {
  const { householdId } = useAuth();
  const { data: accounts = [] } = useAccounts();
  const { data: profiles = [] } = useHouseholdProfiles();
  const { data: taxSummaries = [] } = useTaxSummaries(TAX_YEAR);
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

  // Load primary scenario
  const { data: scenario } = useQuery({
    queryKey: ["retirement_scenario_primary", householdId],
    queryFn: async () => {
      if (!householdId) return null;
      const { data, error } = await supabase
        .from("retirement_scenarios")
        .select("*")
        .eq("household_id", householdId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!householdId,
  });

  // DB pension params
  const dbPensionParams: DBPensionParams[] = useMemo(() =>
    dbPensions.map((p) => toDBPensionParams(p)), [dbPensions]);

  // ISA pot
  const totalIsaPot = useMemo(() =>
    accounts
      .filter((a) => a.account_type === "cash_isa" || a.account_type === "stocks_and_shares_isa")
      .reduce((sum, a) => sum + Number(a.current_value), 0),
    [accounts]);

  // Compute projection
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
      isaPot: totalIsaPot,
      isaDrawdownRate: 0.04,
      isaGrowthRate: Number(scenario.expected_return),
    };
    return { result: computeRetirement(inputs, dbPensionParams), inputs };
  }, [scenario, dbPensionParams, totalIsaPot]);

  const monthlyIncome = projection ? Math.round(projection.result.totalIncome / 12) : null;
  const retireAge = scenario?.retirement_age ?? 57;
  const targetIncome = scenario ? Number(scenario.target_income) : 30000;

  return (
    <motion.div className="flex flex-col gap-5" variants={stagger.container} initial="initial" animate="animate">
      {/* 1. Hero — Monthly Income */}
      <motion.div variants={stagger.item}>
        <IncomeHeroCard
          monthlyIncome={monthlyIncome}
          retireAge={retireAge}
          projection={projection?.result ?? null}
          targetIncome={targetIncome}
        />
      </motion.div>

      {/* 2. Income Timeline */}
      {projection && (
        <motion.div variants={stagger.item}>
          <IncomeTimeline
            timeline={projection.result.timeline}
            retireAge={retireAge}
            targetIncome={targetIncome}
          />
        </motion.div>
      )}

      {/* 3. Supporting Cards Row */}
      <motion.div variants={stagger.item} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReadinessCard projection={projection?.result ?? null} retireAge={retireAge} targetIncome={targetIncome} />
        <TopActionsCard accounts={accounts} memberANIs={memberANIs} isaUsed={householdIsaUsed} isaLimit={isaLimit} />
      </motion.div>

      {/* 4. Wealth Summary Strip */}
      <motion.div variants={stagger.item}>
        <WealthSummaryStrip accounts={accounts} />
      </motion.div>
    </motion.div>
  );
}
