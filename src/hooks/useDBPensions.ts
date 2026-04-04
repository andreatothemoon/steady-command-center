import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type DBPension = {
  id: string;
  household_id: string;
  name: string;
  scheme_type: "CARE" | "FINAL_SALARY";
  current_age: number;
  retirement_age: number;
  current_salary: number;
  salary_growth_rate: number;
  accrual_rate: number;
  is_active_member: boolean;
  revaluation_type: "CPI" | "fixed";
  revaluation_rate: number;
  revaluation_uplift: number;
  indexation_type: "CPI" | "capped";
  indexation_cap: number;
  existing_income: number;
  created_at: string;
  updated_at: string;
};

export type DBPensionInput = Omit<DBPension, "id" | "household_id" | "created_at" | "updated_at">;

const KEY = "db_pensions";

export function useDBPensions() {
  const { householdId } = useAuth();
  return useQuery({
    queryKey: [KEY, householdId],
    queryFn: async () => {
      if (!householdId) return [];
      const { data, error } = await supabase
        .from("db_pensions")
        .select("*")
        .eq("household_id", householdId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DBPension[];
    },
    enabled: !!householdId,
  });
}

export function useUpsertDBPension() {
  const { householdId } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: DBPensionInput & { id?: string }) => {
      if (!householdId) throw new Error("No household");
      const { id, ...values } = input;
      if (id) {
        const { error } = await supabase.from("db_pensions").update(values).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("db_pensions").insert({ ...values, household_id: householdId });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, householdId] }),
  });
}

export function useDeleteDBPension() {
  const { householdId } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("db_pensions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, householdId] }),
  });
}
