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
    <motion.div className="flex flex-col gap-5" variants={stagger.container} initial="initial" animate="animate">
      {/* 1. HERO — Net Worth */}
      <motion.div variants={stagger.item} className="order-1">
        <NetWorthHero
          accounts={accounts}
          adultsCount={adults.length || 1}
          childrenCount={children.length}
        />
      </motion.div>

      {/* 4. ACTION CENTER — Mobile: appears 2nd, Desktop: after progress */}
      <motion.div variants={stagger.item} className="order-2 lg:order-4">
        <ActionCenter accounts={accounts} ani={ani} isaUsed={isaUsed} isaLimit={isaLimit} />
      </motion.div>

      {/* 2. SNAPSHOT ROW — Mobile: 3rd, Desktop: 2nd */}
      <motion.div variants={stagger.item} className="order-3 lg:order-2">
        <SnapshotRow accounts={accounts} />
      </motion.div>

      {/* 3. PROGRESS LAYER — Retirement + Tax */}
      <motion.div variants={stagger.item} className="grid grid-cols-1 gap-4 lg:grid-cols-2 order-4 lg:order-3">
        <RetirementProgress accounts={accounts} />
        <TaxPosition ani={ani} isaUsed={isaUsed} isaLimit={isaLimit} />
      </motion.div>

      {/* 5. COLLAPSIBLE INSIGHTS — Asset allocation, property, debt */}
      <motion.div variants={stagger.item}>
        <CollapsibleInsights accounts={accounts} />
      </motion.div>
    </motion.div>
  );
}
