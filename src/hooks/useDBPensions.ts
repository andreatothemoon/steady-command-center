import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type DBPension = {
  id: string;
  household_id: string;
  account_id: string | null;
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

export type DBPensionInput = Omit<DBPension, "id" | "household_id" | "account_id" | "created_at" | "updated_at">;

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
        // Update pension
        const { error } = await supabase.from("db_pensions").update(values).eq("id", id);
        if (error) throw error;

        // Also update the linked account name if it exists
        const { data: pension } = await supabase
          .from("db_pensions")
          .select("account_id")
          .eq("id", id)
          .single();

        if (pension?.account_id) {
          await supabase
            .from("accounts")
            .update({ name: values.name })
            .eq("id", pension.account_id);
        }
      } else {
        // Create a linked account first
        const { data: account, error: accErr } = await supabase
          .from("accounts")
          .insert({
            household_id: householdId,
            name: values.name,
            account_type: "db_pension" as any,
            wrapper_type: "db_pension" as any,
            current_value: 0,
            owner_name: "You",
          })
          .select()
          .single();
        if (accErr) throw accErr;

        // Then create the pension linked to that account
        const { error } = await supabase
          .from("db_pensions")
          .insert({ ...values, household_id: householdId, account_id: account.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, householdId] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteDBPension() {
  const { householdId } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get linked account_id before deleting
      const { data: pension } = await supabase
        .from("db_pensions")
        .select("account_id")
        .eq("id", id)
        .single();

      const { error } = await supabase.from("db_pensions").delete().eq("id", id);
      if (error) throw error;

      // Delete linked account if it exists
      if (pension?.account_id) {
        await supabase.from("accounts").delete().eq("id", pension.account_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, householdId] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
