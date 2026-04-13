/**
 * Actions Page — placeholder, wraps existing ActionCenter with full-page layout
 */
import { useAccounts } from "@/hooks/useAccounts";
import { useHouseholdProfiles } from "@/hooks/useHouseholdProfiles";
import { useTaxSummaries, computeANI, summaryToForm } from "@/hooks/useTaxSummaries";
import ActionCenter from "@/components/ActionCenter";
import type { MemberANI } from "@/pages/OverviewPage";

const TAX_YEAR = "2025/26";

export default function ActionsPage() {
  const { data: accounts = [] } = useAccounts();
  const { data: profiles = [] } = useHouseholdProfiles();
  const { data: taxSummaries = [] } = useTaxSummaries(TAX_YEAR);

  const adults = profiles.filter((p) => p.role === "adult");
  const memberANIs: MemberANI[] = adults.map((p) => {
    const summary = taxSummaries.find((s) => s.member_profile_id === p.id);
    const form = summaryToForm(summary);
    const computed = computeANI(form);
    return { name: p.name, ani: computed.adjusted_net_income, pensionContributions: computed.pension_contributions };
  });

  const householdIsaUsed = taxSummaries.reduce((sum, s) => sum + Number(s.isa_contributions ?? 0), 0);
  const isaLimit = adults.length > 0 ? adults.length * 20000 : 20000;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Actions</h1>
        <p className="label-subtle mt-1">Prioritised actions to improve your financial position</p>
      </div>
      <ActionCenter accounts={accounts} memberANIs={memberANIs} isaUsed={householdIsaUsed} isaLimit={isaLimit} />
    </div>
  );
}
