import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RetirementScenario {
  id: string;
  name: string;
  current_age: number;
  retirement_age: number;
  current_pot: number;
  monthly_contribution: number;
  employer_contribution: number;
  expected_return: number;
  inflation_rate: number;
  target_income: number;
  household_id: string;
  created_at: string;
  updated_at: string;
}

const scenariosKey = (householdId: string | null) => ["retirement_scenarios", householdId] as const;
const selectedScenarioKey = (householdId: string | null) => ["selected_retirement_scenario", householdId] as const;
const selectionColumnAvailableKey = (householdId: string | null) =>
  ["retirement_scenario_selection_column_available", householdId] as const;

const selectedScenarioStorageKey = (householdId: string) =>
  `steady:selected-retirement-scenario:${householdId}`;

function readStoredSelectedScenarioId(householdId: string | null) {
  if (!householdId || typeof window === "undefined") return null;
  return window.localStorage.getItem(selectedScenarioStorageKey(householdId));
}

function writeStoredSelectedScenarioId(householdId: string | null, scenarioId: string | null) {
  if (!householdId || typeof window === "undefined") return;
  const storageKey = selectedScenarioStorageKey(householdId);
  if (scenarioId) {
    window.localStorage.setItem(storageKey, scenarioId);
  } else {
    window.localStorage.removeItem(storageKey);
  }
}

export function useRetirementScenarios() {
  const { householdId } = useAuth();

  return useQuery({
    queryKey: scenariosKey(householdId),
    queryFn: async () => {
      if (!householdId) return [];
      const { data, error } = await supabase
        .from("retirement_scenarios")
        .select("*")
        .eq("household_id", householdId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as RetirementScenario[];
    },
    enabled: !!householdId,
  });
}

export function useSelectedRetirementScenario() {
  const { householdId } = useAuth();
  const qc = useQueryClient();
  const scenariosQuery = useRetirementScenarios();

  const selectedIdQuery = useQuery({
    queryKey: selectedScenarioKey(householdId),
    queryFn: async () => {
      if (!householdId) return null;
      const storedScenarioId = readStoredSelectedScenarioId(householdId);
      const { data, error } = await supabase
        .from("households")
        .select("*")
        .eq("id", householdId)
        .maybeSingle();
      if (error) throw error;
      const hasSelectionColumn = !!data && "selected_retirement_scenario_id" in data;
      qc.setQueryData(selectionColumnAvailableKey(householdId), hasSelectionColumn);
      if (!hasSelectionColumn) return storedScenarioId;
      return (data.selected_retirement_scenario_id as string | null) ?? storedScenarioId;
    },
    enabled: !!householdId,
    retry: false,
  });

  const scenarios = scenariosQuery.data ?? [];
  const selectedScenario =
    scenarios.find((scenario) => scenario.id === selectedIdQuery.data) ??
    scenarios[0] ??
    null;

  return {
    scenario: selectedScenario,
    scenarios,
    selectedScenarioId: selectedIdQuery.data,
    isLoading: scenariosQuery.isLoading || selectedIdQuery.isLoading,
    isError: scenariosQuery.isError || selectedIdQuery.isError,
    error: scenariosQuery.error ?? selectedIdQuery.error,
  };
}

export function useSetSelectedRetirementScenario() {
  const { householdId } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (scenarioId: string | null) => {
      if (!householdId) throw new Error("No household");
      const hasSelectionColumn = qc.getQueryData<boolean>(selectionColumnAvailableKey(householdId)) === true;
      if (!hasSelectionColumn) return scenarioId;
      const { error } = await supabase
        .from("households")
        .update({ selected_retirement_scenario_id: scenarioId })
        .eq("id", householdId);
      if (error) throw error;
      return scenarioId;
    },
    onMutate: async (scenarioId) => {
      const queryKey = selectedScenarioKey(householdId);
      await qc.cancelQueries({ queryKey });
      const previousScenarioId = qc.getQueryData<string | null>(queryKey);
      writeStoredSelectedScenarioId(householdId, scenarioId);
      qc.setQueryData(queryKey, scenarioId);
      return { previousScenarioId };
    },
    onError: (_error, _scenarioId, context) => {
      writeStoredSelectedScenarioId(householdId, context?.previousScenarioId ?? null);
      qc.setQueryData(selectedScenarioKey(householdId), context?.previousScenarioId ?? null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: selectedScenarioKey(householdId) });
    },
  });
}
