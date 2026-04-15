/**
 * Actions Page — Decision-driving ranked action list with income impact
 */
import { motion } from "framer-motion";
import {
  Clock, TrendingUp,
  CheckCircle2, Circle, ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatCurrency, daysAgo, staleness } from "@/lib/format";
import { useAccounts, type Account } from "@/hooks/useAccounts";
import { useHouseholdProfiles } from "@/hooks/useHouseholdProfiles";
import { useTaxSummaries, computeANI, summaryToForm } from "@/hooks/useTaxSummaries";
import { DEFAULT_DRAWDOWN_RATE } from "@/lib/retirementEngine";

type Severity = "high" | "medium" | "low";
type Effort = "easy" | "moderate" | "involved";

interface ActionItem {
  id: string;
  title: string;
  description: string;
  impact: string;
  secondaryImpact: string | null;
  monthlyGain: number | null;
  effort: Effort;
  severity: Severity;
  cta: string;
  route: string;
  category: string;
  status: "recommended" | "pending";
}

interface MemberANI { name: string; ani: number; pensionContributions: number }

const TAX_YEAR = "2025/26";

const severityStyle: Record<Severity, { badge: string }> = {
  high:   { badge: "bg-destructive/15 text-destructive" },
  medium: { badge: "bg-warning/15 text-warning" },
  low:    { badge: "bg-secondary text-muted-foreground" },
};

const effortStyle: Record<Effort, { label: string; cls: string }> = {
  easy:     { label: "Quick win", cls: "bg-success/10 text-success" },
  moderate: { label: "Moderate", cls: "bg-chart-3/10 text-chart-3" },
  involved: { label: "Involved", cls: "bg-chart-4/10 text-chart-4" },
};

const stagger = {
  container: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
  item: { initial: { opacity: 0, x: -8 }, animate: { opacity: 1, x: 0, transition: { duration: 0.3 } } },
};

function buildActions(accounts: Account[], memberANIs: MemberANI[], isaUsed: number, isaLimit: number): ActionItem[] {
  const actions: ActionItem[] = [];

  // Stale accounts
  const staleAccounts = accounts.filter((a) => staleness(a.last_updated) === "stale");
  staleAccounts.forEach((a) => {
    const days = daysAgo(a.last_updated);
    actions.push({
      id: `stale-${a.id}`,
      title: `Update ${a.name}`,
      description: `Refresh this account so your wealth and retirement model reflects current balances and debt.`,
      impact: "Sharper planning accuracy",
      secondaryImpact: `${days} days old`,
      monthlyGain: null,
      effort: "easy",
      severity: days > 180 ? "high" : "medium",
      cta: "Update now",
      route: "/wealth",
      category: "Planning",
      status: days > 180 ? "recommended" : "pending",
    });
  });

  // ANI alerts
  memberANIs.forEach((m) => {
    if (m.ani > 0 && m.ani < 100000) {
      const buffer = 100000 - m.ani;
      if (buffer < 15000) {
        actions.push({
          id: `ani-${m.name}`,
          title: `${m.name}'s ANI approaching £100k`,
          description: `${formatCurrency(buffer)} buffer remains before personal allowance taper starts to bite harder.`,
          impact: "Stay ahead of the £100k taper",
          secondaryImpact: `${formatCurrency(Math.round(12570 / 12))}/mo if optimised`,
          monthlyGain: Math.round(12570 / 12),
          effort: "moderate",
          severity: buffer < 5000 ? "high" : "medium",
          cta: "Review tax position",
          route: "/profile",
          category: "Tax Efficiency",
          status: buffer < 5000 ? "recommended" : "pending",
        });
      }
    } else if (m.ani >= 100000) {
      actions.push({
        id: `ani-exceeded-${m.name}`,
        title: `${m.name}'s ANI exceeds £100k`,
        description: `Currently ${formatCurrency(m.ani)}, so personal allowance tapering is already in effect.`,
        impact: "Restore personal allowance",
        secondaryImpact: `+${formatCurrency(Math.round(12570 / 12))}/mo if reduced below £100k`,
        monthlyGain: Math.round(12570 / 12),
        effort: "involved",
        severity: "high",
        cta: "Review options",
        route: "/profile",
        category: "Tax Efficiency",
        status: "recommended",
      });
    }
  });

  // ISA deadline
  const isaRemaining = isaLimit - isaUsed;
  if (isaRemaining > 0 && isaRemaining < 5000) {
    const incomeGain = Math.round((isaRemaining * DEFAULT_DRAWDOWN_RATE) / 12);
    actions.push({
      id: "isa-deadline",
      title: `ISA allowance — ${formatCurrency(isaRemaining)} remaining`,
      description: "Tax year deadline approaching. Using the remainder now keeps more future growth sheltered.",
      impact: `Shelter ${formatCurrency(isaRemaining)} before year end`,
      secondaryImpact: incomeGain > 0 ? `+${formatCurrency(incomeGain)}/mo potential income` : "Tax-free growth",
      monthlyGain: incomeGain > 0 ? incomeGain : null,
      effort: "easy",
      severity: "medium",
      cta: "View allowances",
      route: "/profile",
      category: "High Impact",
      status: "recommended",
    });
  }

  // Aging batch
  const agingAccounts = accounts.filter((a) => staleness(a.last_updated) === "aging");
  if (agingAccounts.length >= 3) {
    actions.push({
      id: "aging-batch",
      title: `${agingAccounts.length} accounts aging`,
      description: "Several balances are getting stale and will gradually weaken the quality of your projections.",
      impact: "Keep the model current",
      secondaryImpact: "Between 30–91 days since last update",
      monthlyGain: null,
      effort: "moderate",
      severity: "low",
      cta: "View accounts",
      route: "/wealth",
      category: "Maintenance",
      status: "pending",
    });
  }

  // Sort by severity
  const order: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  actions.sort((a, b) => order[a.severity] - order[b.severity]);
  return actions;
}

export default function ActionsPage() {
  const navigate = useNavigate();
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
  const isaUsed = taxSummaries.reduce((sum, s) => sum + Number(s.isa_contributions ?? 0), 0);
  const isaLimit = adults.length > 0 ? adults.length * 20000 : 20000;

  const actions = buildActions(accounts, memberANIs, isaUsed, isaLimit);
  const highCount = actions.filter((a) => a.severity === "high").length;
  const recommendedCount = actions.filter((a) => a.status === "recommended").length;
  const pendingCount = actions.filter((a) => a.status === "pending").length;
  const quickWins = actions.filter((a) => a.effort === "easy").length;
  const totalMonthlyImpact = actions.reduce((sum, action) => sum + (action.monthlyGain ?? 0), 0);
  const categoryCounts = Array.from(
    actions.reduce((map, action) => {
      map.set(action.category, (map.get(action.category) ?? 0) + 1);
      return map;
    }, new Map<string, number>())
  );

  return (
    <motion.div className="space-y-8" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item}>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Actions</h1>
        <p className="mt-2 text-muted-foreground">Personalized steps to improve your plan, reduce tax drag, and keep your numbers current.</p>
      </motion.div>

      {actions.length > 0 && (
        <motion.div variants={stagger.item} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card-surface p-8">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fef3f2]">
                <Circle className="h-5 w-5 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Recommended</h2>
            </div>
            <p className="text-4xl font-semibold tracking-[-0.05em] text-foreground">{recommendedCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">{highCount} high-priority right now</p>
          </div>
          <div className="card-surface p-8">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff7ed]">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Pending</h2>
            </div>
            <p className="text-4xl font-semibold tracking-[-0.05em] text-foreground">{pendingCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">{quickWins} quick wins available</p>
          </div>
          <div className="card-surface p-8">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0fdf4]">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Potential Impact</h2>
            </div>
            <p className="text-4xl font-semibold tracking-[-0.05em] text-foreground">
              {totalMonthlyImpact > 0 ? `+${formatCurrency(totalMonthlyImpact)}` : "—"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Estimated extra monthly retirement income</p>
          </div>
        </motion.div>
      )}

      {actions.length > 0 && (
        <motion.div variants={stagger.item} className="flex flex-wrap gap-3">
          <span className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            All <span className="opacity-75">({actions.length})</span>
          </span>
          {categoryCounts.map(([category, count]) => (
            <span
              key={category}
              className="rounded-full border border-border/60 bg-card px-4 py-2 text-sm text-muted-foreground"
            >
              {category} <span className="opacity-70">({count})</span>
            </span>
          ))}
        </motion.div>
      )}

      {actions.length === 0 ? (
        <motion.div variants={stagger.item} className="card-surface p-12 text-center">
          <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-3" />
          <p className="text-sm font-medium text-card-foreground">All clear</p>
          <p className="text-[11px] text-muted-foreground mt-1">No actions needed — everything is up to date</p>
        </motion.div>
      ) : (
        <motion.div variants={stagger.container} className="space-y-4">
          {actions.map((action) => {
            const sev = severityStyle[action.severity];
            const eff = effortStyle[action.effort];
            return (
              <motion.button
                key={action.id}
                variants={stagger.item}
                onClick={() => navigate(action.route)}
                className={cn(
                  "group w-full rounded-[28px] border border-border/60 bg-card px-7 py-7 text-left transition-all duration-150 hover:shadow-sm",
                  "flex items-start justify-between gap-5"
                )}
              >
                <div className="flex flex-1 items-start gap-4">
                  <div className={cn(
                    "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl",
                    action.status === "recommended"
                      ? "bg-[#fef3f2] text-destructive"
                      : action.severity === "medium"
                        ? "bg-[#fff7ed] text-warning"
                      : "bg-[#f5f7fb] text-primary"
                  )}>
                    {action.status === "recommended" ? <Circle className="h-5 w-5" /> :
                     action.severity === "medium" ? <Clock className="h-5 w-5" /> :
                     <TrendingUp className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <p className="text-xl font-semibold text-card-foreground leading-tight">{action.title}</p>
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", sev.badge)}>
                        {action.status === "recommended" ? "recommended" : action.severity}
                      </span>
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", eff.cls)}>{eff.label}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{action.category}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Impact</p>
                        <p className="text-sm font-semibold text-success">{action.impact}</p>
                      </div>
                      {action.secondaryImpact && (
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Additional benefit</p>
                          <p className="text-sm font-medium text-foreground">{action.secondaryImpact}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <span className="flex-shrink-0 whitespace-nowrap rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground flex items-center gap-1.5 transition-colors group-hover:bg-primary/92">
                  {action.cta} <ArrowRight className="h-4 w-4" />
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {actions.length > 0 && (
        <motion.div variants={stagger.item} className="card-surface p-8">
          <h2 className="text-2xl font-semibold text-foreground">Total Potential Impact</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Additional monthly retirement income</p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-success">
                {totalMonthlyImpact > 0 ? `+${formatCurrency(totalMonthlyImpact)}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recommended actions</p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-foreground">{recommendedCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quick wins</p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-foreground">{quickWins}</p>
            </div>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            The strongest gains come from tax efficiency, ISA usage, and keeping source balances up to date.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
