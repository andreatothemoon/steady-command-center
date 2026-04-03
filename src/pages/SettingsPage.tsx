import { motion } from "framer-motion";
import { User, Shield, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  },
};

export default function SettingsPage() {
  const { signOut } = useAuth();

  return (
    <motion.div className="space-y-5" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="label-subtle mt-1">Manage your household and preferences</p>
      </motion.div>

      <motion.div variants={stagger.item} className="card-surface p-5">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-5 w-5 text-muted-foreground" />
          <p className="label-muted">Household</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-card-foreground">James</p>
              <p className="text-[11px] text-muted-foreground">Primary · james@email.com</p>
            </div>
            <Button variant="outline" size="sm">Edit</Button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-card-foreground">Sarah</p>
              <p className="text-[11px] text-muted-foreground">Partner · sarah@email.com</p>
            </div>
            <Button variant="outline" size="sm">Edit</Button>
          </div>
        </div>
      </motion.div>

      <motion.div variants={stagger.item} className="card-surface p-5">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <p className="label-muted">Security</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="label-subtle">Manage your session</p>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </motion.div>

      <motion.div variants={stagger.item} className="card-surface p-5">
        <div className="flex items-center gap-3 mb-4">
          <Database className="h-5 w-5 text-muted-foreground" />
          <p className="label-muted">Data</p>
        </div>
        <p className="label-subtle">Export and import options coming soon.</p>
      </motion.div>
    </motion.div>
  );
}
