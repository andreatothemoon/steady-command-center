import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function parseCurrencyInput(val: string): number {
  const cleaned = val.replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : Math.max(0, n);
}

export function CurrencyField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [raw, setRaw] = useState(value > 0 ? String(value) : "");

  useEffect(() => {
    setRaw(value > 0 ? String(value) : "");
  }, [value]);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">£</span>
        <Input
          type="text"
          inputMode="decimal"
          disabled={disabled}
          className="pl-7 tabular-nums text-sm bg-background border-border text-foreground"
          placeholder="0"
          value={raw}
          onChange={(e) => {
            const v = e.target.value;
            if (/^[0-9]*\.?[0-9]{0,2}$/.test(v) && v.length <= 12) {
              setRaw(v);
              onChange(parseCurrencyInput(v));
            }
          }}
          onBlur={() => {
            const n = parseCurrencyInput(raw);
            setRaw(n > 0 ? String(n) : "");
            onChange(n);
          }}
        />
      </div>
    </div>
  );
}
