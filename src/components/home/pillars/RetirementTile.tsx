import { motion } from "framer-motion";
import { Target } from "lucide-react";
import PillarTile from "./PillarTile";
import { formatCurrency } from "@/lib/format";
import type { RetirementProjection } from "@/lib/retirementEngine";

interface Props {
  projection: RetirementProjection | null;
  retireAge: number;
  targetIncome: number;
}

export default function RetirementTile({ projection, retireAge, targetIncome }: Props) {
  const monthly = projection ? Math.round(projection.totalIncome / 12) : null;
  const monthlyTarget = Math.round(targetIncome / 12);
  const readiness = projection?.readinessPct ?? 0;

  return (
    <PillarTile
      to="/retirement"
      eyebrow="Retirement"
      title={`Retirement at ${retireAge}`}
      icon={Target}
      accent="success"
      footer={
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Readiness</span>
            <span className="font-semibold text-foreground tabular-nums">{readiness}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary/70">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(readiness, 100)}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </div>
        </div>
      }
    >
      <div>
        <p className="text-[11px] text-muted-foreground">Projected monthly income</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
          {monthly !== null ? formatCurrency(monthly) : "—"}
          <span className="ml-1 text-sm font-medium text-muted-foreground">/mo</span>
        </p>
        <p className="mt-1 text-[12px] text-muted-foreground tabular-nums">
          Target {formatCurrency(monthlyTarget)}/mo
        </p>
      </div>
    </PillarTile>
  );
}
