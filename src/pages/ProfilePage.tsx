/**
 * Profile Page — placeholder absorbing Settings, Documents, Tax
 * Renders existing SettingsPage for now, with tabs for Documents and Tax
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import SettingsPage from "@/pages/SettingsPage";
import DocumentsPage from "@/pages/DocumentsPage";
import TaxPage from "@/pages/TaxPage";

const tabs = [
  { key: "settings", label: "Settings" },
  { key: "tax", label: "Tax" },
  { key: "documents", label: "Documents" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("settings");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Profile</h1>
        <p className="label-subtle mt-1">Household settings, tax position, and documents</p>
      </div>

      <div className="flex items-center gap-1 bg-secondary/30 rounded-lg p-0.5 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
              activeTab === tab.key
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "settings" && <SettingsPage />}
      {activeTab === "tax" && <TaxPage />}
      {activeTab === "documents" && <DocumentsPage />}
    </div>
  );
}
