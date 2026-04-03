import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type HouseholdProfile = Tables<"household_profiles">;

export function useHouseholdProfiles() {
  const { householdId } = useAuth();

  return useQuery({
    queryKey: ["household_profiles", householdId],
    queryFn: async () => {
      if (!householdId) return [];
      const { data, error } = await supabase
        .from("household_profiles")
        .select("*")
        .eq("household_id", householdId)
        .order("is_primary", { ascending: false })
        .order("role", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as HouseholdProfile[];
    },
    enabled: !!householdId,
  });
}

export function useAddHouseholdProfile() {
  const qc = useQueryClient();
  const { householdId } = useAuth();

  return useMutation({
    mutationFn: async (input: Omit<TablesInsert<"household_profiles">, "household_id">) => {
      if (!householdId) throw new Error("No household");
      const { data, error } = await supabase
        .from("household_profiles")
        .insert({ ...input, household_id: householdId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["household_profiles"] });
    },
  });
}

export function useUpdateHouseholdProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HouseholdProfile> & { id: string }) => {
      const { data, error } = await supabase
        .from("household_profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["household_profiles"] });
    },
  });
}

export function useDeleteHouseholdProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("household_profiles")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["household_profiles"] });
    },
  });
}
