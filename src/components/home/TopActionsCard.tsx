import { useNavigate } from "react-router-dom";
import { Clock, AlertTriangle, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, staleness, daysAgo } from "@/lib/format";
import type { Account } from "@/hooks/useAccounts";

interface MemberANI {
  name: string;
  ani: number;
}

interface Props {
  accounts: Account[];
  memberANIs?: MemberANI[];
  isaUsed?: number;
  isaLimit?: number;
  showHeader?: boolean;
}

interface ActionItem {
  id: string;
  title: string;
  impact: string;
  secondary?: string;
  detail: string;
  severity: "high" | "medium" | "low";
  route: string;
  category: "freshness" | "tax" | "optimisation";
}

export default function TopActionsCard({ accounts, memberANIs = [], isaUsed = 0, isaLimit = 20000, showHeader = true }: Props) {
  const navigate = useNavigate();

  const actions: ActionItem[] = [];

  const staleAccounts = accounts.filter((a) => staleness(a.last_updated) === "stale");
  staleAccounts.slice(0, 2).forEach((a) => {
    const days = daysAgo(a.last_updated);
    actions.push({
      id: `stale-${a.id}`,
      title: `Update ${a.name}`,
      impact: "Sharper retirement and wealth projections",
      secondary: `${days} days old`,
      severity: days > 180 ? "high" : "medium",
      route: "/wealth",
      category: "freshness",
      detail: "Refreshing this account will make the model more accurate.",
    });
  });

  memberANIs.forEach((m) => {
    if (m.ani > 85000) {
      const contributionNeeded = m.ani >= 100000 ? Math.ceil((m.ani - 100000) / 100) * 100 : null;
      actions.push({
        id: `ani-${m.name}`,
        title: m.ani >= 100000 ? `Reduce ${m.name}'s ANI` : `Review ${m.name}'s tax position`,
        impact: m.ani >= 100000
          ? `Potentially restore ${formatCurrency(Math.round((m.ani - 100000) / 2))} of personal allowance`
          : "Stay ahead of the £100k taper",
        secondary: contributionNeeded ? `${formatCurrency(contributionNeeded)} pension contribution could help` : formatCurrency(m.ani),
        severity: m.ani >= 100000 ? "high" : "medium",
        route: "/profile",
        category: "tax",
        detail: m.ani >= 100000
          ? "A targeted pension contribution may reduce tax drag and preserve allowance."
          : "Checking this now keeps more planning options open before year end.",
      });
    }
  });

  const isaRemaining = isaLimit - isaUsed;
  if (isaRemaining > 0 && isaRemaining < 5000) {
    actions.push({
      id: "isa-deadline",
      title: `Max out ISA allowance`,
      impact: `Shelter ${formatCurrency(isaRemaining)} before year end`,
      secondary: "Use the remaining ISA allowance",
      severity: "medium",
      route: "/profile",
      category: "optimisation",
      detail: "This is one of the cleaner levers available in your current plan.",
    });
  }

  const severityOrder = { high: 0, medium: 1, low: 2 };
  actions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  const top = actions.slice(0, 2);

  if (top.length === 0) {
    return (
      <div className="card-surface flex min-h-[220px] items-center gap-3 p-8">
        <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
        <div>
          <p className="text-base font-medium text-card-foreground">All clear</p>
          <p className="mt-0.5 text-sm text-muted-foreground">No actions needed right now</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-surface h-full p-8">
      {showHeader && (
        <div className="mb-6">
          <h3 className="mb-2 text-2xl font-semibold text-foreground">Recommended Actions</h3>
          <p className="text-sm text-muted-foreground">Highest-impact actions based on your latest data.</p>
        </div>
      )}
      <div className="space-y-4">
        {top.map((action) => (
          <button
            key={action.id}
            onClick={() => navigate(action.route)}
            className="group flex w-full items-center justify-between gap-8 rounded-[2rem] border border-border/60 bg-card px-8 py-7 text-left transition-all hover:shadow-sm"
          >
            <div className="flex flex-1 items-start gap-5">
              <div
                className={cn(
                  "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[28px]",
                  action.severity === "high"
                    ? "bg-destructive/10 text-destructive"
                    : action.category === "optimisation"
                      ? "bg-secondary text-success"
                      : "bg-secondary text-primary"
                )}
              >
                {action.category === "freshness" ? <Clock className="h-5 w-5" /> : action.category === "tax" ? <AlertTriangle className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="mb-4 text-[2rem] font-semibold tracking-[-0.04em] text-foreground">{action.title}</h4>
                <div className="mb-4 flex flex-wrap items-center gap-x-8 gap-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl text-muted-foreground">Impact:</span>
                    <span
                      className={cn(
                        "text-[1.1rem] font-semibold",
                        action.severity === "high" ? "text-destructive" : action.category === "optimisation" ? "text-success" : "text-foreground"
                      )}
                    >
                      {action.impact}
                    </span>
                  </div>
                  {action.secondary && (
                    <span className="text-xl text-muted-foreground">{action.secondary}</span>
                  )}
                </div>
                <p className="text-xl text-muted-foreground">{action.detail}</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-3 rounded-[28px] bg-primary px-8 py-5 text-xl font-semibold text-primary-foreground transition-colors group-hover:bg-primary/92">
              Try this <ArrowRight className="h-5 w-5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
