/**
 * Actions Page — Decision-driving ranked action list with income impact
 */
import { motion } from "framer-motion";
import {
  Clock, ArrowUpRight, AlertTriangle, TrendingUp,
  CheckCircle2, Zap, ChevronRight,
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
  context: string;
  incomeImpact: string | null;
  effort: Effort;
  severity: Severity;
  cta: string;
  route: string;
}

interface MemberANI { name: string; ani: number; pensionContributions: number }

const TAX_YEAR = "2025/26";

const severityStyle: Record<Severity, { border: string; icon: string; badge: string }> = {
  high:   { border: "border-l-destructive", icon: "text-destructive", badge: "bg-destructive/15 text-destructive" },
  medium: { border: "border-l-warning", icon: "text-warning", badge: "bg-warning/15 text-warning" },
  low:    { border: "border-l-muted-foreground/30", icon: "text-muted-foreground", badge: "bg-secondary text-muted-foreground" },
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
      context: `Last updated ${days} days ago — affects net worth accuracy`,
      incomeImpact: null,
      effort: "easy",
      severity: days > 180 ? "high" : "medium",
      cta: "Update now",
      route: "/wealth",
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
          context: `${formatCurrency(buffer)} buffer remaining — risk of losing personal allowance`,
          incomeImpact: `+${formatCurrency(Math.round(12570 / 12))}/mo if optimised`,
          effort: "moderate",
          severity: buffer < 5000 ? "high" : "medium",
          cta: "Review tax position",
          route: "/profile",
        });
      }
    } else if (m.ani >= 100000) {
      actions.push({
        id: `ani-exceeded-${m.name}`,
        title: `${m.name}'s ANI exceeds £100k`,
        context: `Currently ${formatCurrency(m.ani)} — personal allowance tapering in effect`,
        incomeImpact: `+${formatCurrency(Math.round(12570 / 12))}/mo if reduced below £100k`,
        effort: "involved",
        severity: "high",
        cta: "Review options",
        route: "/profile",
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
      context: "Tax year deadline approaching — use it or lose it",
      incomeImpact: incomeGain > 0 ? `+${formatCurrency(incomeGain)}/mo potential income` : null,
      effort: "easy",
      severity: "medium",
      cta: "View allowances",
      route: "/profile",
    });
  }

  // Aging batch
  const agingAccounts = accounts.filter((a) => staleness(a.last_updated) === "aging");
  if (agingAccounts.length >= 3) {
    actions.push({
      id: "aging-batch",
      title: `${agingAccounts.length} accounts aging`,
      context: "Between 30–91 days since last update",
      incomeImpact: null,
      effort: "moderate",
      severity: "low",
      cta: "View accounts",
      route: "/wealth",
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

  return (
    <motion.div className="space-y-5" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Actions</h1>
        <p className="label-subtle mt-1">Prioritised actions ranked by income impact</p>
      </motion.div>

      {/* Summary */}
      {actions.length > 0 && (
        <motion.div variants={stagger.item} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className={cn("card-surface p-4", highCount > 0 && "border-destructive/20")}>
            <p className="label-muted">Urgent</p>
            <p className="value-large mt-1 text-destructive">{highCount}</p>
          </div>
          <div className="card-surface p-4">
            <p className="label-muted">Total Actions</p>
            <p className="value-large mt-1">{actions.length}</p>
          </div>
          <div className="card-surface p-4">
            <p className="label-muted">Quick Wins</p>
            <p className="value-large mt-1 text-success">{actions.filter(a => a.effort === "easy").length}</p>
          </div>
        </motion.div>
      )}

      {/* Action list */}
      {actions.length === 0 ? (
        <motion.div variants={stagger.item} className="card-surface p-8 text-center">
          <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-3" />
          <p className="text-sm font-medium text-card-foreground">All clear</p>
          <p className="text-[11px] text-muted-foreground mt-1">No actions needed — everything is up to date</p>
        </motion.div>
      ) : (
        <motion.div variants={stagger.container} className="space-y-2">
          {actions.map((action) => {
            const sev = severityStyle[action.severity];
            const eff = effortStyle[action.effort];
            return (
              <motion.button
                key={action.id}
                variants={stagger.item}
                onClick={() => navigate(action.route)}
                className={cn(
                  "w-full text-left card-surface px-5 py-4 flex items-start gap-3.5 group transition-colors duration-150",
                  "hover:bg-secondary/30 border-l-2 rounded-xl",
                  sev.border
                )}
              >
                <div className={cn("mt-0.5 flex-shrink-0", sev.icon)}>
                  {action.severity === "high" ? <AlertTriangle className="h-4.5 w-4.5" /> :
                   action.severity === "medium" ? <Clock className="h-4.5 w-4.5" /> :
                   <TrendingUp className="h-4.5 w-4.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground leading-tight">{action.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{action.context}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {action.incomeImpact && (
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {action.incomeImpact}
                      </span>
                    )}
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", eff.cls)}>
                      {eff.label}
                    </span>
                  </div>
                </div>
                <span className="flex-shrink-0 text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 mt-0.5 whitespace-nowrap">
                  {action.cta} <ChevronRight className="h-3 w-3" />
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
