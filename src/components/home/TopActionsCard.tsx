import { useNavigate } from "react-router-dom";
import { Clock, AlertTriangle, TrendingUp, CheckCircle2 } from "lucide-react";
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
}

interface ActionItem {
  id: string;
  title: string;
  context: string;
  severity: "high" | "medium" | "low";
  route: string;
  category: "freshness" | "tax" | "optimisation";
}

export default function TopActionsCard({ accounts, memberANIs = [], isaUsed = 0, isaLimit = 20000 }: Props) {
  const navigate = useNavigate();

  const actions: ActionItem[] = [];

  const staleAccounts = accounts.filter((a) => staleness(a.last_updated) === "stale");
  staleAccounts.slice(0, 2).forEach((a) => {
    const days = daysAgo(a.last_updated);
    actions.push({
      id: `stale-${a.id}`,
      title: `Update ${a.name}`,
      context: `${days} days old`,
      severity: days > 180 ? "high" : "medium",
      route: "/wealth",
      category: "freshness",
    });
  });

  memberANIs.forEach((m) => {
    if (m.ani > 85000) {
      actions.push({
        id: `ani-${m.name}`,
        title: m.ani >= 100000 ? `${m.name}'s ANI over £100k` : `${m.name}'s ANI approaching £100k`,
        context: formatCurrency(m.ani),
        severity: m.ani >= 100000 ? "high" : "medium",
        route: "/profile",
        category: "tax",
      });
    }
  });

  const isaRemaining = isaLimit - isaUsed;
  if (isaRemaining > 0 && isaRemaining < 5000) {
    actions.push({
      id: "isa-deadline",
      title: `Max out ISA allowance`,
      context: `${formatCurrency(isaRemaining)} remaining this tax year`,
      severity: "medium",
      route: "/profile",
      category: "optimisation",
    });
  }

  const severityOrder = { high: 0, medium: 1, low: 2 };
  actions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  const top = actions.slice(0, 2);

  if (top.length === 0) {
    return (
      <div className="card-surface lg:col-span-2 min-h-[220px] p-8 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-card-foreground">All clear</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">No actions needed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-surface h-full p-8 lg:col-span-2">
      <div className="mb-6">
        <h3 className="mb-2 text-2xl font-semibold text-foreground">Recommended Actions</h3>
        <p className="text-sm text-muted-foreground">Highest-impact actions based on your latest data.</p>
      </div>
      <div className="space-y-4">
        {top.map((action) => (
          <button
            key={action.id}
            onClick={() => navigate(action.route)}
            className="group flex w-full items-start justify-between gap-5 rounded-3xl border border-border/60 bg-card px-6 py-6 text-left transition-all hover:shadow-sm"
          >
            <div className="flex flex-1 items-start gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl",
                  action.severity === "high"
                    ? "bg-[#fef3f2] text-destructive"
                    : action.category === "optimisation"
                      ? "bg-[#f0fdf4] text-success"
                      : "bg-[#f5f7fb] text-primary"
                )}
              >
                {action.category === "freshness" ? <Clock className="h-5 w-5" /> : action.category === "tax" ? <AlertTriangle className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="mb-2 text-xl font-semibold text-foreground">{action.title}</h4>
                <div className="mb-2 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Impact:</span>
                    <span
                      className={cn(
                        "text-base font-semibold",
                        action.severity === "high" ? "text-destructive" : action.category === "optimisation" ? "text-success" : "text-foreground"
                      )}
                    >
                      {action.context}
                    </span>
                  </div>
                  <span className="text-sm capitalize text-muted-foreground">{action.category}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {action.category === "freshness"
                    ? "Refreshing this account will make the model more accurate."
                    : action.category === "tax"
                      ? "Reviewing this could reduce tax drag and preserve allowances."
                      : "This is one of the cleaner levers available in your current plan."}
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors group-hover:bg-primary/92">
              Try this
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
