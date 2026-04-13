import { useNavigate } from "react-router-dom";
import { Clock, AlertTriangle, TrendingUp, CheckCircle2, ArrowUpRight } from "lucide-react";
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

  // Stale accounts
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

  // ANI alerts
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

  // ISA
  const isaRemaining = isaLimit - isaUsed;
  if (isaRemaining > 0 && isaRemaining < 5000) {
    actions.push({
      id: "isa-deadline",
      title: `ISA — ${formatCurrency(isaRemaining)} remaining`,
      context: "Tax year deadline approaching",
      severity: "medium",
      route: "/profile",
      category: "optimisation",
    });
  }

  // Limit to top 3
  const severityOrder = { high: 0, medium: 1, low: 2 };
  actions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  const top = actions.slice(0, 3);

  if (top.length === 0) {
    return (
      <div className="card-insight p-5 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-card-foreground">All clear</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">No actions needed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-insight p-5 h-full flex flex-col">
      <p className="label-muted mb-3" style={{ opacity: 1 }}>Top Actions</p>
      <div className="space-y-2 flex-1">
        {top.map((action) => (
          <button
            key={action.id}
            onClick={() => navigate(action.route)}
            className={cn(
              "w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-2.5 group transition-colors",
              "hover:bg-secondary/20 border-l-2",
              action.severity === "high" ? "border-l-destructive" : action.severity === "medium" ? "border-l-warning" : "border-l-muted-foreground/30"
            )}
          >
            <div className={cn("mt-0.5 flex-shrink-0", action.severity === "high" ? "text-destructive" : action.severity === "medium" ? "text-warning" : "text-muted-foreground")}>
              {action.category === "freshness" ? <Clock className="h-3.5 w-3.5" /> : action.category === "tax" ? <AlertTriangle className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-card-foreground leading-tight">{action.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{action.context}</p>
            </div>
            <ArrowUpRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
