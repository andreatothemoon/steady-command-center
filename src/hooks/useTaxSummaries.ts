import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type TaxYearSummary = Tables<"tax_year_summaries">;

export function useTaxSummaries(taxYear: string) {
  const { householdId } = useAuth();

  return useQuery({
    queryKey: ["tax_year_summaries", householdId, taxYear],
    queryFn: async () => {
      if (!householdId) return [];
      const { data, error } = await supabase
        .from("tax_year_summaries")
        .select("*")
        .eq("household_id", householdId)
        .eq("tax_year", taxYear);
      if (error) throw error;
      return (data ?? []) as TaxYearSummary[];
    },
    enabled: !!householdId,
  });
}

export function useUpsertTaxSummary() {
  const qc = useQueryClient();
  const { householdId } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      id?: string;
      member_profile_id: string | null;
      tax_year: string;
      gross_income: number;
      pension_contributions: number;
      isa_contributions: number;
      capital_gains: number;
    }) => {
      if (!householdId) throw new Error("No household");

      const ani = Math.max(0, input.gross_income - input.pension_contributions);

      if (input.id) {
        const { data, error } = await supabase
          .from("tax_year_summaries")
          .update({
            gross_income: input.gross_income,
            pension_contributions: input.pension_contributions,
            isa_contributions: input.isa_contributions,
            capital_gains: input.capital_gains,
            adjusted_net_income: ani,
          })
          .eq("id", input.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("tax_year_summaries")
          .insert({
            household_id: householdId,
            member_profile_id: input.member_profile_id,
            tax_year: input.tax_year,
            gross_income: input.gross_income,
            pension_contributions: input.pension_contributions,
            isa_contributions: input.isa_contributions,
            capital_gains: input.capital_gains,
            adjusted_net_income: ani,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tax_year_summaries"] });
    },
  });
}
