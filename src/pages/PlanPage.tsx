/**
 * Plan — Life Planning & Decision Engine
 * The flagship exploration surface: scenarios, timeline, goals, decisions, insights.
 */
import { useState } from "react";
import { PlanProvider } from "@/planning/store/PlanContext";
import type { PlanEvent } from "@/planning/types";
import PlanHero from "@/components/life-plan/PlanHero";
import ScenarioSelector from "@/components/life-plan/ScenarioSelector";
import LifeTimeline from "@/components/life-plan/LifeTimeline";
import TimelineEventEditor from "@/components/life-plan/TimelineEventEditor";
import GoalsRail from "@/components/life-plan/GoalsRail";
import DecisionsSection from "@/components/life-plan/DecisionsSection";
import InsightsSection from "@/components/life-plan/InsightsSection";
import FloatingImpactCard from "@/components/life-plan/FloatingImpactCard";

export default function PlanPage() {
  return (
    <PlanProvider>
      <PlanPageInner />
    </PlanProvider>
  );
}

function PlanPageInner() {
  const [editing, setEditing] = useState<PlanEvent | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8 md:px-6 md:py-10">
      <PlanHero />
      <ScenarioSelector />
      <LifeTimeline
        onSelectEvent={(ev) => {
          setEditing(ev);
          setEditorOpen(true);
        }}
      />
      <GoalsRail />
      <DecisionsSection />
      <InsightsSection />

      <TimelineEventEditor event={editing} open={editorOpen} onOpenChange={setEditorOpen} />
      <FloatingImpactCard />
    </div>
  );
}
