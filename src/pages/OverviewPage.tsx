import { motion } from "framer-motion";
import { useAccounts } from "@/hooks/useAccounts";
import { useHouseholdProfiles } from "@/hooks/useHouseholdProfiles";
import NetWorthHero from "@/components/overview/NetWorthHero";
import SnapshotRow from "@/components/overview/SnapshotRow";
import RetirementProgress from "@/components/overview/RetirementProgress";
import TaxPosition from "@/components/overview/TaxPosition";
import ActionCenter from "@/components/ActionCenter";
import CollapsibleInsights from "@/components/overview/CollapsibleInsights";

const stagger = {
  container: { transition: { staggerChildren: 0.08 } },
  item: {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
  },
};

export default function OverviewPage() {
  const { data: accounts = [] } = useAccounts();
  const { data: profiles = [] } = useHouseholdProfiles();

  const adults = profiles.filter((p) => p.role === "adult");
  const children = profiles.filter((p) => p.role === "child");

  const isaLimit = adults.length > 0 ? adults.length * 20000 : 20000;
  const isaUsed = 18000;
  const ani = 72000;

  return (
    <motion.div className="space-y-5" variants={stagger.container} initial="initial" animate="animate">
      {/* 1. HERO — Net Worth */}
      <motion.div variants={stagger.item}>
        <NetWorthHero
          accounts={accounts}
          adultsCount={adults.length || 1}
          childrenCount={children.length}
        />
      </motion.div>

      {/* 2. SNAPSHOT ROW — 4 cards */}
      <motion.div variants={stagger.item}>
        <SnapshotRow accounts={accounts} />
      </motion.div>

      {/* 3. PROGRESS LAYER — Retirement + Tax side by side (desktop) */}
      <motion.div variants={stagger.item} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RetirementProgress accounts={accounts} />
        <TaxPosition ani={ani} isaUsed={isaUsed} isaLimit={isaLimit} />
      </motion.div>

      {/* 4. ACTION CENTER */}
      {/* On mobile: appears high priority (order managed via CSS) */}
      <motion.div variants={stagger.item} className="order-first lg:order-none">
        <ActionCenter accounts={accounts} ani={ani} isaUsed={isaUsed} isaLimit={isaLimit} />
      </motion.div>

      {/* 5. COLLAPSIBLE INSIGHTS — Asset allocation, property, debt */}
      <motion.div variants={stagger.item}>
        <CollapsibleInsights accounts={accounts} />
      </motion.div>
    </motion.div>
  );
}
