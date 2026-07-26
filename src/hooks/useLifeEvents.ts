import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type LifeEventRow = Tables<"life_events">;
export type LifeEventEffectRow = Tables<"life_event_effects">;

export type LifeEventWithEffects = LifeEventRow & {
  effects: LifeEventEffectRow[];
};

export type EffectInput = Omit<
  TablesInsert<"life_event_effects">,
  "id" | "event_id" | "created_at" | "updated_at"
>;

export type LifeEventInput = {
  title: string;
  event_type: string;
  event_date: string; // ISO YYYY-MM-DD
  probability: number; // 0..1
  status: string;
  notes?: string | null;
  profile_id?: string | null;
  effects: EffectInput[];
};

const KEY = ["life_events"] as const;

export function useLifeEvents() {
  const { householdId } = useAuth();

  return useQuery({
    queryKey: [...KEY, householdId],
    queryFn: async (): Promise<LifeEventWithEffects[]> => {
      if (!householdId) return [];
      const { data, error } = await supabase
        .from("life_events")
        .select("*, effects:life_event_effects(*)")
        .eq("household_id", householdId)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as LifeEventWithEffects[];
    },
    enabled: !!householdId,
  });
}

export function useUpsertLifeEvent() {
  const qc = useQueryClient();
  const { householdId } = useAuth();

  return useMutation({
    mutationFn: async (input: LifeEventInput & { id?: string }) => {
      if (!householdId) throw new Error("No household");

      const { effects, id, ...eventFields } = input;

      let eventId = id;
      if (eventId) {
        const { error } = await supabase
          .from("life_events")
          .update({ ...eventFields })
          .eq("id", eventId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("life_events")
          .insert({ ...eventFields, household_id: householdId })
          .select("id")
          .single();
        if (error) throw error;
        eventId = data.id;
      }

      // Replace effects: simplest correct approach for an inline editor.
      const { error: delErr } = await supabase
        .from("life_event_effects")
        .delete()
        .eq("event_id", eventId);
      if (delErr) throw delErr;

      if (effects.length > 0) {
        const rows = effects.map((e) => ({ ...e, event_id: eventId! }));
        const { error: insErr } = await supabase
          .from("life_event_effects")
          .insert(rows);
        if (insErr) throw insErr;
      }

      return eventId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Life event saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLifeEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("life_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Life event removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
