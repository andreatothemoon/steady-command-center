import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export type TaxYearSummary = Tables<"tax_year_summaries">;

export interface MemberFormState {
  salary: number;
  bonus: number;
  taxable_benefits: number;
  dividend_income: number;
  salary_sacrifice_pension: number;
  employer_pension: number;
  personal_pension_net: number;
  gift_aid: number;
  other_salary_sacrifice: number;
  isa_contributions: number;
  capital_gains: number;
}

export const emptyForm: MemberFormState = {
  salary: 0,
  bonus: 0,
  taxable_benefits: 0,
  dividend_income: 0,
  salary_sacrifice_pension: 0,
  employer_pension: 0,
  personal_pension_net: 0,
  gift_aid: 0,
  other_salary_sacrifice: 0,
  isa_contributions: 0,
  capital_gains: 0,
};

export function summaryToForm(s: TaxYearSummary | undefined): MemberFormState {
  if (!s) return { ...emptyForm };
  return {
    salary: Number(s.salary ?? 0),
    bonus: Number(s.bonus ?? 0),
    taxable_benefits: Number(s.taxable_benefits ?? 0),
    dividend_income: Number(s.dividend_income ?? 0),
    salary_sacrifice_pension: Number(s.salary_sacrifice_pension ?? 0),
    employer_pension: Number(s.employer_pension ?? 0),
    personal_pension_net: Number(s.personal_pension_net ?? 0),
    gift_aid: Number(s.gift_aid ?? 0),
    other_salary_sacrifice: Number(s.other_salary_sacrifice ?? 0),
    isa_contributions: Number(s.isa_contributions ?? 0),
    capital_gains: Number(s.capital_gains ?? 0),
  };
}

export function computeANI(f: MemberFormState) {
  const gross_income = f.salary + f.bonus + f.taxable_benefits + f.dividend_income;
  const salary_sacrifice_total = f.salary_sacrifice_pension + f.other_salary_sacrifice;
  const grossed_up_personal_pension = f.personal_pension_net * (100 / 80);
  const grossed_up_gift_aid = f.gift_aid * (100 / 80);
  const adjusted_net_income = Math.max(
    0,
    gross_income - salary_sacrifice_total - grossed_up_personal_pension - grossed_up_gift_aid
  );
  const pension_contributions =
    f.salary_sacrifice_pension + f.employer_pension + grossed_up_personal_pension;

  return {
    gross_income,
    salary_sacrifice_total,
    grossed_up_personal_pension,
    grossed_up_gift_aid,
    adjusted_net_income,
    pension_contributions,
    buffer_100k: Math.max(0, 100000 - adjusted_net_income),
    buffer_125k: Math.max(0, 125140 - adjusted_net_income),
  };
}

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
    } & MemberFormState) => {
      if (!householdId) throw new Error("No household");

      const computed = computeANI(input);

      const payload = {
        salary: input.salary,
        bonus: input.bonus,
        taxable_benefits: input.taxable_benefits,
        dividend_income: input.dividend_income,
        salary_sacrifice_pension: input.salary_sacrifice_pension,
        employer_pension: input.employer_pension,
        personal_pension_net: input.personal_pension_net,
        gift_aid: input.gift_aid,
        other_salary_sacrifice: input.other_salary_sacrifice,
        isa_contributions: input.isa_contributions,
        capital_gains: input.capital_gains,
        gross_income: computed.gross_income,
        pension_contributions: computed.pension_contributions,
        adjusted_net_income: computed.adjusted_net_income,
      };

      if (input.id) {
        const { data, error } = await supabase
          .from("tax_year_summaries")
          .update(payload)
          .eq("id", input.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("tax_year_summaries")
          .insert({
            ...payload,
            household_id: householdId,
            member_profile_id: input.member_profile_id,
            tax_year: input.tax_year,
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
