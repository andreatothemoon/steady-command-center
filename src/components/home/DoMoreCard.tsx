import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

export default function DoMoreCard() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/retirement")}
      className="card-surface group relative flex h-full min-h-[260px] w-full flex-col items-center justify-center gap-5 overflow-hidden p-8 text-center transition-shadow hover:shadow-sm"
    >
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">Do more with your assets</h3>
        <p className="mt-2 max-w-xs text-[13px] text-muted-foreground">
          Model scenarios, unlock tax efficiency, and plan the bridge to retirement.
        </p>
      </div>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_16px_40px_-18px_hsl(var(--primary)/0.6)] transition-transform group-hover:scale-105">
        <Plus className="h-5 w-5" />
      </span>
    </button>
  );
}
