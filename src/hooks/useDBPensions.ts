import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type DBPension = Tables<"db_pensions">;
export type DBPensionInput = Omit<TablesInsert<"db_pensions">, "household_id" | "account_id">;

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
        const { error } = await supabase
          .from("db_pensions")
          .update(values as TablesUpdate<"db_pensions">)
          .eq("id", id);
        if (error) throw error;

        const { data: pension, error: pensionError } = await supabase
          .from("db_pensions")
          .select("account_id")
          .eq("id", id)
          .single();
        if (pensionError) throw pensionError;

        if (pension?.account_id) {
          const { error: accountError } = await supabase
            .from("accounts")
            .update({ name: values.name })
            .eq("id", pension.account_id);
          if (accountError) throw accountError;
        }

        return;
      }

      const { data: account, error: accountCreateError } = await supabase
        .from("accounts")
        .insert({
          household_id: householdId,
          name: values.name ?? "DB Pension",
          account_type: "db_pension",
          wrapper_type: "db_pension",
          source_type: "manual",
          current_value: 0,
          owner_name: values.name ?? "DB Pension",
        })
        .select("id")
        .single();
      if (accountCreateError) throw accountCreateError;

      const { error: pensionCreateError } = await supabase
        .from("db_pensions")
        .insert({ ...values, household_id: householdId, account_id: account.id });

      if (pensionCreateError) {
        await supabase.from("accounts").delete().eq("id", account.id);
        throw pensionCreateError;
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
      const { data: pension, error: pensionError } = await supabase
        .from("db_pensions")
        .select("account_id")
        .eq("id", id)
        .single();
      if (pensionError) throw pensionError;

      const { error } = await supabase.from("db_pensions").delete().eq("id", id);
      if (error) throw error;

      if (pension?.account_id) {
        const { error: accountError } = await supabase.from("accounts").delete().eq("id", pension.account_id);
        if (accountError) throw accountError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, householdId] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
