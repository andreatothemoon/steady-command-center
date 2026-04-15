/**
 * Profile Page — Tabbed: Settings, Tax, Documents
 * Clean visual hierarchy with icon tabs
 */
import { useState } from "react";
import { Settings, Receipt, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import SettingsPage from "@/pages/SettingsPage";
import DocumentsPage from "@/pages/DocumentsPage";
import TaxPage from "@/pages/TaxPage";

const tabs = [
  { key: "settings" as const, label: "Settings", icon: Settings },
  { key: "tax" as const, label: "Tax", icon: Receipt },
  { key: "documents" as const, label: "Documents", icon: FileText },
];

type TabKey = (typeof tabs)[number]["key"];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("settings");

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Profile</h1>
        <p className="mt-2 text-muted-foreground">Household settings, tax position, and documents in one place.</p>
      </div>

      <div className="inline-flex items-center gap-1 rounded-2xl border border-border/60 bg-card p-1.5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.18)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all duration-200",
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-[0_12px_24px_-16px_rgba(30,58,95,0.45)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {activeTab === "settings" && <SettingsPage />}
        {activeTab === "tax" && <TaxPage />}
        {activeTab === "documents" && <DocumentsPage />}
      </motion.div>
    </motion.div>
  );
}
