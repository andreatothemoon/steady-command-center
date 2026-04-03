import { motion } from "framer-motion";
import { User, Shield, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your household and preferences</p>
      </div>

      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <User className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-card-foreground">Household</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-card-foreground">James</p>
                <p className="text-xs text-muted-foreground">Primary · james@email.com</p>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-card-foreground">Sarah</p>
                <p className="text-xs text-muted-foreground">Partner · sarah@email.com</p>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-card-foreground">Security</h2>
          </div>
          <p className="text-sm text-muted-foreground">Authentication and data privacy settings will appear here once backend is connected.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-card-foreground">Data</h2>
          </div>
          <p className="text-sm text-muted-foreground">Export and import options coming soon.</p>
        </motion.div>
      </div>
    </div>
  );
}
