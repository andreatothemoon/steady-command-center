import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  to: string;
  eyebrow: string;
  title: string;
  icon: LucideIcon;
  accent?: "primary" | "success" | "warning" | "destructive" | "muted";
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const accentMap = {
  primary: "bg-secondary text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/20 text-foreground",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
} as const;

export default function PillarTile({
  to,
  eyebrow,
  title,
  icon: Icon,
  accent = "primary",
  children,
  footer,
  className,
}: Props) {
  const navigate = useNavigate();
  return (
    <motion.button
      onClick={() => navigate(to)}
      whileHover="hover"
      initial="rest"
      animate="rest"
      className={cn(
        "card-surface group relative flex h-full w-full flex-col gap-4 p-6 text-left transition-shadow hover:shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full",
              accentMap[accent],
            )}
          >
            <Icon className="h-[17px] w-[17px]" strokeWidth={2} />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {eyebrow}
            </p>
            <p className="mt-0.5 text-[15px] font-semibold tracking-tight text-foreground">
              {title}
            </p>
          </div>
        </div>
        <motion.span
          variants={{ rest: { x: 0 }, hover: { x: 3 } }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="mt-1 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground/60"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
        </motion.span>
      </div>

      <div className="flex flex-1 flex-col justify-center">{children}</div>

      {footer && <div className="pt-1">{footer}</div>}
    </motion.button>
  );
}
