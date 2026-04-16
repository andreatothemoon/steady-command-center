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
import { useHouseholdProfiles } from "@/hooks/useHouseholdProfiles";

const tabs = [
  { key: "settings" as const, label: "Settings", icon: Settings },
  { key: "tax" as const, label: "Tax", icon: Receipt },
  { key: "documents" as const, label: "Documents", icon: FileText },
];

type TabKey = (typeof tabs)[number]["key"];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("settings");
  const { data: profiles = [] } = useHouseholdProfiles();
  const adults = profiles.filter((profile) => profile.role === "adult");
  const primaryAdult = adults.find((profile) => profile.is_primary) ?? adults[0] ?? null;
  const initials = primaryAdult
    ? primaryAdult.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()
    : "HH";

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Profile</h1>
        <p className="mt-2 text-muted-foreground">Manage your household details, tax setup, and supporting documents in one place.</p>
      </div>

      <div className="card-surface p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
              {initials}
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                {primaryAdult?.name ?? "Your household"}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {adults.length > 0
                  ? `${adults.length} adult${adults.length !== 1 ? "s" : ""} in the plan`
                  : "Set up your household details to personalize planning and allowances."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <span className="rounded-full bg-secondary px-4 py-2 text-sm text-muted-foreground">
                  {profiles.length} household member{profiles.length !== 1 ? "s" : ""}
                </span>
                <span className="rounded-full bg-secondary px-4 py-2 text-sm text-muted-foreground">
                  {activeTab === "settings" ? "Settings view" : activeTab === "tax" ? "Tax view" : "Documents view"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full bg-secondary px-4 py-2 text-sm font-medium text-success">
            <span className="h-2 w-2 rounded-full bg-success" />
            Active
          </div>
        </div>
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
