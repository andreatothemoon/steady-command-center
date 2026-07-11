import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/planning/store/PlanContext";
import { formatCurrency } from "@/lib/format";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Projection } from "@/planning/types";

/**
 * FloatingImpactCard — appears whenever the active projection materially
 * changes (e.g. after switching scenario). Non-blocking, dismissable.
 */
export default function FloatingImpactCard() {
  const { projection, activeScenario } = usePlan();
  const previous = useRef<Projection | null>(null);
  const previousScenarioId = useRef<string>(activeScenario.id);
  const [visible, setVisible] = useState(false);
  const [snapshot, setSnapshot] = useState<{ before: Projection; after: Projection } | null>(null);

  useEffect(() => {
    if (
      previous.current &&
      previousScenarioId.current !== activeScenario.id
    ) {
      setSnapshot({ before: previous.current, after: projection });
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 6000);
      return () => clearTimeout(t);
    }
    previous.current = projection;
    previousScenarioId.current = activeScenario.id;
  }, [projection, activeScenario.id]);

  return (
    <AnimatePresence>
      {visible && snapshot && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 right-6 z-40 w-[320px]"
        >
          <Card className="border-border/70 bg-card/95 p-4 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                Impact of switching
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setVisible(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <ImpactRow
                label="FI year"
                before={String(snapshot.before.fiYear)}
                after={String(snapshot.after.fiYear)}
              />
              <ImpactRow
                label="Monthly income"
                before={formatCurrency(snapshot.before.retirementMonthlyIncome)}
                after={formatCurrency(snapshot.after.retirementMonthlyIncome)}
              />
              <ImpactRow
                label="Confidence"
                before={`${Math.round(snapshot.before.confidence * 100)}%`}
                after={`${Math.round(snapshot.after.confidence * 100)}%`}
              />
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ImpactRow({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <div className="font-medium">
        <span className="text-muted-foreground">{before}</span>
        <span className="mx-1 text-muted-foreground">→</span>
        <span className="text-foreground">{after}</span>
      </div>
    </div>
  );
}
