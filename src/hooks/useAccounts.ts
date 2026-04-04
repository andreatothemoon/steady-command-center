import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Account = Tables<"accounts"> & {
  institutions?: { name: string; logo_url: string | null } | null;
};

export function useAccounts() {
  const { householdId } = useAuth();

  return useQuery({
    queryKey: ["accounts", householdId],
    queryFn: async () => {
      if (!householdId) return [];
      const { data, error } = await supabase
        .from("accounts")
        .select("*, institutions(name, logo_url)")
        .eq("household_id", householdId)
        .order("current_value", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Account[];
    },
    enabled: !!householdId,
  });
}

export function useAddAccount() {
  const qc = useQueryClient();
  const { householdId } = useAuth();

  return useMutation({
    mutationFn: async (input: Omit<TablesInsert<"accounts">, "household_id">) => {
      if (!householdId) throw new Error("No household");
      const { data, error } = await supabase
        .from("accounts")
        .insert({ ...input, household_id: householdId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"accounts"> & { id: string }) => {
      const { data, error } = await supabase
        .from("accounts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
