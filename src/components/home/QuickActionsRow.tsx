import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Plus,
  Camera,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Action {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  emphasis?: boolean;
}

export default function QuickActionsRow() {
  const navigate = useNavigate();

  const actions: Action[] = [
    { id: "contribute", label: "Contribute", icon: ArrowUpRight, emphasis: true, onClick: () => navigate("/wealth?action=contribute") },
    { id: "add", label: "Add account", icon: Plus, onClick: () => navigate("/wealth?action=add") },
    { id: "snapshot", label: "Snapshot", icon: Camera, onClick: () => navigate("/wealth?action=snapshot") },
    { id: "import", label: "Import CSV", icon: Upload, onClick: () => navigate("/wealth?action=import") },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {actions.map(({ id, label, icon: Icon, onClick, emphasis }) => (
        <button
          key={id}
          onClick={onClick}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
            emphasis
              ? "bg-primary text-primary-foreground hover:bg-primary/92"
              : "bg-secondary/85 text-foreground hover:bg-secondary",
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
