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
  const scenariosQuery = useRetirementScenarios();

  const selectedIdQuery = useQuery({
    queryKey: selectedScenarioKey(householdId),
    queryFn: async () => {
      if (!householdId) return null;
      const { data, error } = await supabase
        .from("households")
        .select("selected_retirement_scenario_id")
        .eq("id", householdId)
        .maybeSingle();
      if (error) throw error;
      return data?.selected_retirement_scenario_id ?? null;
    },
    enabled: !!householdId,
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
      qc.setQueryData(queryKey, scenarioId);
      return { previousScenarioId };
    },
    onError: (_error, _scenarioId, context) => {
      qc.setQueryData(selectedScenarioKey(householdId), context?.previousScenarioId ?? null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: selectedScenarioKey(householdId) });
    },
  });
}
