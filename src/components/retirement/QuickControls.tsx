import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "@/lib/format";
import { Settings2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const item = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface SliderConfig {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}

interface Props {
  quickSliders: SliderConfig[];
  advancedSliders: SliderConfig[];
  isSaving: boolean;
}

export default function QuickControls({ quickSliders, advancedSliders, isSaving }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <motion.div variants={item} className="card-insight p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="label-muted">Controls</p>
        {isSaving && (
          <span className="text-[10px] text-muted-foreground/60 animate-pulse">Saving…</span>
        )}
      </div>

      {quickSliders.map((s) => (
        <div key={s.label}>
          <div className="flex justify-between mb-1.5">
            <span className="text-[11px] text-muted-foreground">{s.label}</span>
            <span className="text-[11px] font-semibold text-card-foreground tabular-nums">{s.format(s.value)}</span>
          </div>
          <Slider
            value={[s.value]}
            onValueChange={([v]) => s.onChange(v)}
            min={s.min}
            max={s.max}
            step={s.step}
            className="w-full"
          />
        </div>
      ))}

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-card-foreground transition-colors mt-2"
      >
        <Settings2 className="w-3.5 h-3.5" />
        {showAdvanced ? "Hide" : "Show"} advanced settings
      </button>

      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4 pt-2 border-t border-border/50"
        >
          {advancedSliders.map((s) => (
            <div key={s.label}>
              <div className="flex justify-between mb-1.5">
                <span className="text-[11px] text-muted-foreground">{s.label}</span>
                <span className="text-[11px] font-semibold text-card-foreground tabular-nums">{s.format(s.value)}</span>
              </div>
              <Slider
                value={[s.value]}
                onValueChange={([v]) => s.onChange(v)}
                min={s.min}
                max={s.max}
                step={s.step}
                className="w-full"
              />
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
