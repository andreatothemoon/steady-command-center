import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Settings2 } from "lucide-react";
import { useState } from "react";

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
  disabled?: boolean;
}

interface ToggleConfig {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface Props {
  quickSliders: SliderConfig[];
  advancedSliders: SliderConfig[];
  advancedToggles?: ToggleConfig[];
  isSaving: boolean;
}

export default function QuickControls({ quickSliders, advancedSliders, advancedToggles = [], isSaving }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <motion.div variants={item} className="card-surface space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-foreground">Controls</p>
          <p className="mt-1 text-sm text-muted-foreground">Adjust the assumptions driving this scenario.</p>
        </div>
        {isSaving && (
          <span className="text-[11px] text-muted-foreground animate-pulse">Saving…</span>
        )}
      </div>

      {quickSliders.map((s) => (
        <div key={s.label} className="rounded-2xl bg-secondary/60 p-4">
          <div className="mb-2 flex justify-between">
            <span className="text-sm text-muted-foreground">{s.label}</span>
            <span className="text-sm font-semibold text-card-foreground tabular-nums">{s.format(s.value)}</span>
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
        className="mt-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-card-foreground"
      >
        <Settings2 className="w-3.5 h-3.5" />
        {showAdvanced ? "Hide" : "Show"} advanced settings
      </button>

      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4 border-t border-border/60 pt-4"
        >
          {advancedToggles.map((toggle) => (
            <div key={toggle.label} className="flex items-center justify-between gap-4 rounded-2xl bg-secondary/60 p-4">
              <div>
                <p className="text-sm text-muted-foreground">{toggle.label}</p>
                {toggle.description && <p className="mt-1 text-xs text-muted-foreground/80">{toggle.description}</p>}
              </div>
              <Switch checked={toggle.checked} onCheckedChange={toggle.onChange} />
            </div>
          ))}
          {advancedSliders.map((s) => (
            <div key={s.label} className="rounded-2xl bg-secondary/60 p-4 opacity-100 data-[disabled=true]:opacity-45" data-disabled={s.disabled}>
              <div className="mb-2 flex justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <span className="text-sm font-semibold text-card-foreground tabular-nums">{s.format(s.value)}</span>
              </div>
              <Slider
                value={[s.value]}
                onValueChange={([v]) => {
                  if (!s.disabled) s.onChange(v);
                }}
                min={s.min}
                max={s.max}
                step={s.step}
                className="w-full"
                disabled={s.disabled}
              />
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
