import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type CashFlow = Tables<"cash_flows">;
export type CashFlowInsert = TablesInsert<"cash_flows">;
export type CashFlowUpdate = TablesUpdate<"cash_flows">;

export function useCashFlows() {
  const { householdId } = useAuth();

  return useQuery({
    queryKey: ["cash_flows", householdId],
    queryFn: async () => {
      if (!householdId) return [];
      const { data, error } = await supabase
        .from("cash_flows")
        .select("*")
        .eq("household_id", householdId)
        .order("flow_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CashFlow[];
    },
    enabled: !!householdId,
  });
}

export function useAddCashFlow() {
  const qc = useQueryClient();
  const { householdId } = useAuth();

  return useMutation({
    mutationFn: async (input: Omit<CashFlowInsert, "household_id">) => {
      if (!householdId) throw new Error("No household");
      const { error } = await supabase.from("cash_flows").insert({
        ...input,
        household_id: householdId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash_flows"] });
      toast.success("Contribution added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCashFlow() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CashFlowUpdate & { id: string }) => {
      const { error } = await supabase
        .from("cash_flows")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash_flows"] });
      toast.success("Contribution updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCashFlow() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cash_flows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash_flows"] });
      toast.success("Contribution removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
