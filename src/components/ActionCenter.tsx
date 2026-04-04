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

interface Props {
  accounts: Account[];
  ani?: number;
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

export default function ActionCenter({ accounts, ani = 0, isaUsed = 0, isaLimit = 20000 }: Props) {
  const navigate = useNavigate();

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
      route: "/accounts",
      category: "freshness",
    });
  });

  // Tax optimisation actions
  if (ani > 0 && ani < 100000) {
    const buffer = 100000 - ani;
    if (buffer < 15000) {
      actions.push({
        id: "ani-approaching",
        title: "ANI approaching £100k threshold",
        context: `${formatCurrency(buffer)} buffer remaining`,
        impact: "Risk of losing personal allowance (£12,570)",
        severity: buffer < 5000 ? "high" : "medium",
        cta: "Review tax position",
        route: "/tax",
        category: "tax",
      });
    }
  } else if (ani >= 100000) {
    actions.push({
      id: "ani-exceeded",
      title: "ANI exceeds £100k threshold",
      context: `Currently ${formatCurrency(ani)}`,
      impact: "Personal allowance tapering in effect",
      severity: "high",
      cta: "Review options",
      route: "/tax",
      category: "tax",
    });
  }

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
      route: "/tax",
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
      route: "/accounts",
      category: "freshness",
    });
  }

  if (actions.length === 0) {
    return (
      <div className="card-insight p-5 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-card-foreground">All clear</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">No actions needed — everything is up to date</p>
        </div>
      </div>
    );
  }

  // Sort by severity
  const severityOrder: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  actions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const highCount = actions.filter((a) => a.severity === "high").length;

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden",
      highCount > 0 ? "border-destructive/20" : "border-border"
    )} style={{
      background: highCount > 0
        ? "linear-gradient(165deg, hsl(0 20% 10%) 0%, hsl(228 20% 9%) 100%)"
        : "linear-gradient(165deg, hsl(228 20% 11%) 0%, hsl(228 20% 9%) 100%)",
      boxShadow: highCount > 0
        ? "0 4px 24px -4px hsl(0 72% 51% / 0.08), inset 0 1px 0 0 hsl(0 30% 18% / 0.3)"
        : "0 2px 12px -4px hsl(0 0% 0% / 0.2), inset 0 1px 0 0 hsl(228 20% 14% / 0.4)"
    }}>
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Lightbulb className="h-4.5 w-4.5 text-primary" style={{ width: 18, height: 18 }} />
          </div>
          <span className="label-muted" style={{ opacity: 1 }}>Action Center</span>
        </div>
        <span className={cn(
          "text-[10px] font-bold px-2.5 py-1 rounded-full tabular-nums",
          highCount > 0
            ? "bg-destructive/15 text-destructive"
            : "bg-primary/10 text-primary"
        )}>
          {actions.length} {actions.length === 1 ? "action" : "actions"}
        </span>
      </div>

      {/* Action Items */}
      <motion.div
        className="divide-y divide-border/40"
        variants={stagger.container}
        initial="initial"
        animate="animate"
      >
        {actions.map((action) => {
          const config = severityConfig[action.severity];
          return (
            <motion.button
              key={action.id}
              variants={stagger.item}
              onClick={() => navigate(action.route)}
              className={cn(
                "w-full text-left px-5 py-3.5 flex items-start gap-3 group transition-colors duration-150",
                "hover:bg-secondary/20 border-l-2",
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
                <p className="text-sm font-medium text-card-foreground leading-tight">{action.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{action.context}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5 italic">{action.impact}</p>
              </div>
              <span className="flex-shrink-0 text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 mt-0.5 whitespace-nowrap">
                {action.cta} <ArrowUpRight className="h-3 w-3" />
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}