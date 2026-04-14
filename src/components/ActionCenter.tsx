import { motion } from "framer-motion";
import {
  Clock,
  ArrowUpRight,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { formatCurrency, daysAgo, staleness } from "@/lib/format";
import type { Account } from "@/hooks/useAccounts";

type Severity = "high" | "medium" | "low";

interface ActionItem {
  id: string;
  title: string;
  context: string;
  impact: string;
  severity: Severity;
  cta: string;
  route: string;
  category: "freshness" | "tax" | "optimisation";
}

interface MemberANI {
  name: string;
  ani: number;
}

interface Props {
  accounts: Account[];
  memberANIs?: MemberANI[];
  isaUsed?: number;
  isaLimit?: number;
}

const severityConfig: Record<Severity, { border: string; icon: string; badge: string; dot: string }> = {
  high: {
    border: "border-l-destructive",
    icon: "text-destructive",
    badge: "status-danger",
    dot: "bg-destructive",
  },
  medium: {
    border: "border-l-warning",
    icon: "text-warning",
    badge: "status-warning",
    dot: "bg-warning",
  },
  low: {
    border: "border-l-muted-foreground/30",
    icon: "text-muted-foreground",
    badge: "",
    dot: "bg-muted-foreground/50",
  },
};

const stagger = {
  container: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
  item: {
    initial: { opacity: 0, x: -8 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } },
  },
};

export default function ActionCenter({ accounts, memberANIs = [], isaUsed = 0, isaLimit = 20000 }: Props) {
  const navigate = useNavigate();
  const MAX_VISIBLE_ACTIONS = 4;

  const actions: ActionItem[] = [];

  // Data freshness actions
  const staleAccounts = accounts.filter((a) => staleness(a.last_updated) === "stale");
  staleAccounts.forEach((a) => {
    const days = daysAgo(a.last_updated);
    actions.push({
      id: `stale-${a.id}`,
      title: `Update ${a.name}`,
      context: `Last updated ${days} days ago`,
      impact: "Affects net worth accuracy",
      severity: days > 180 ? "high" : "medium",
      cta: "Update now",
      route: "/wealth",
      category: "freshness",
    });
  });

  // Per-member ANI alerts
  memberANIs.forEach((m) => {
    if (m.ani > 0 && m.ani < 100000) {
      const buffer = 100000 - m.ani;
      if (buffer < 15000) {
        actions.push({
          id: `ani-approaching-${m.name}`,
          title: `${m.name}'s ANI approaching £100k`,
          context: `${formatCurrency(buffer)} buffer remaining`,
          impact: "Risk of losing personal allowance (£12,570)",
          severity: buffer < 5000 ? "high" : "medium",
          cta: "Review tax position",
          route: "/profile",
          category: "tax",
        });
      }
    } else if (m.ani >= 100000) {
      actions.push({
        id: `ani-exceeded-${m.name}`,
        title: `${m.name}'s ANI exceeds £100k`,
        context: `Currently ${formatCurrency(m.ani)}`,
        impact: "Personal allowance tapering in effect",
        severity: "high",
        cta: "Review options",
        route: "/profile",
        category: "tax",
    });
    }
  });

  // ISA deadline
  const isaRemaining = isaLimit - isaUsed;
  if (isaRemaining > 0 && isaRemaining < 5000) {
    actions.push({
      id: "isa-deadline",
      title: `ISA allowance — ${formatCurrency(isaRemaining)} remaining`,
      context: "Tax year deadline approaching",
      impact: "Use it or lose it — resets 6 April",
      severity: "medium",
      cta: "View allowances",
      route: "/profile",
      category: "optimisation",
    });
  }

  // Aging accounts (not stale yet but getting there)
  const agingAccounts = accounts.filter((a) => staleness(a.last_updated) === "aging");
  if (agingAccounts.length >= 3) {
    actions.push({
      id: "aging-batch",
      title: `${agingAccounts.length} accounts aging`,
      context: "Between 30–91 days since last update",
      impact: "Consider a review cycle",
      severity: "low",
      cta: "View accounts",
      route: "/wealth",
      category: "freshness",
    });
  }

  if (actions.length === 0) {
    return (
      <div className="card-insight p-6 flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
        </div>
        <div>
          <p className="text-base font-semibold text-card-foreground">All clear</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">No actions needed. Everything important is up to date.</p>
        </div>
      </div>
    );
  }

  // Sort by severity
  const severityOrder: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  actions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  const visibleActions = actions.slice(0, MAX_VISIBLE_ACTIONS);
  const hiddenCount = Math.max(0, actions.length - visibleActions.length);

  const highCount = actions.filter((a) => a.severity === "high").length;

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden",
      highCount > 0 ? "border-destructive/20" : "border-border"
    )} style={{
      background: highCount > 0
        ? "linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(23 100% 98%) 100%)"
        : "linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(34 30% 99%) 100%)",
      boxShadow: "0 18px 40px -32px hsl(215 25% 20% / 0.22)"
    }}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "h-10 w-10 rounded-2xl flex items-center justify-center border",
            highCount > 0 ? "bg-orange-50 border-orange-200" : "bg-secondary border-border"
          )}>
            <Lightbulb className="h-4.5 w-4.5 text-primary" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <p className="text-base font-semibold text-card-foreground">Action Center</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">A calm shortlist of what needs attention next.</p>
          </div>
        </div>
        <span className={cn(
          "text-[10px] font-bold px-2.5 py-1 rounded-full tabular-nums",
          highCount > 0
            ? "bg-orange-100 text-orange-700"
            : "bg-secondary text-foreground/70"
        )}>
          {actions.length} {actions.length === 1 ? "action" : "actions"}
        </span>
      </div>

      <div className="px-6 py-3 border-b border-border/40 text-[12px] text-muted-foreground bg-white/60">
        {highCount > 0
          ? "Address the urgent items first, then work through the rest."
          : "A short list of the highest-priority follow-ups right now."}
      </div>

      {/* Action Items */}
      <motion.div
        className="divide-y divide-border/40"
        variants={stagger.container}
        initial="initial"
        animate="animate"
      >
        {visibleActions.map((action) => {
          const config = severityConfig[action.severity];
          return (
            <motion.button
              key={action.id}
              variants={stagger.item}
              onClick={() => navigate(action.route)}
              className={cn(
                "w-full text-left px-6 py-4 flex items-start gap-3 group transition-colors duration-150",
                "hover:bg-secondary/35 border-l-2",
                config.border
              )}
            >
              <div className={cn("mt-0.5 flex-shrink-0", config.icon)}>
                {action.category === "freshness" ? (
                  <Clock className="h-4 w-4" />
                ) : action.category === "tax" ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-card-foreground leading-tight">{action.title}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{action.context}</p>
                <p className="text-[12px] text-muted-foreground/80 mt-0.5">{action.impact}</p>
              </div>
              <span className="flex-shrink-0 text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 mt-0.5 whitespace-nowrap">
                {action.cta} <ArrowUpRight className="h-3 w-3" />
              </span>
            </motion.button>
          );
        })}
        {hiddenCount > 0 && (
          <div className="px-6 py-3 text-[11px] text-muted-foreground bg-secondary/20">
            {hiddenCount} more item{hiddenCount !== 1 ? "s" : ""} available in the related sections.
          </div>
        )}
      </motion.div>
    </div>
  );
}
