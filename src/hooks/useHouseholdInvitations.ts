import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface HouseholdInvitation {
  id: string;
  household_id: string;
  token: string;
  email: string | null;
  invited_by: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
  created_at: string;
  updated_at: string;
}

const TABLE = "household_invitations" as any;

function genToken() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function useHouseholdInvitations() {
  const { householdId } = useAuth();

  return useQuery({
    queryKey: ["household_invitations", householdId],
    queryFn: async () => {
      if (!householdId) return [];
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .select("*")
        .eq("household_id", householdId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as HouseholdInvitation[];
    },
    enabled: !!householdId,
  });
}

export function useCreateInvitation() {
  const qc = useQueryClient();
  const { householdId, user } = useAuth();

  return useMutation({
    mutationFn: async (input: { email?: string | null }) => {
      if (!householdId || !user) throw new Error("No household");
      const token = genToken();
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .insert({
          household_id: householdId,
          token,
          email: input.email || null,
          invited_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data as HouseholdInvitation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["household_invitations"] });
    },
  });
}

export function useRevokeInvitation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from(TABLE)
        .update({ status: "revoked" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["household_invitations"] });
    },
  });
}

export function useInvitationByToken(token: string | null) {
  return useQuery({
    queryKey: ["invitation_token", token],
    queryFn: async () => {
      if (!token) return null;
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .select("id, household_id, status, expires_at, email")
        .eq("token", token)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      // Fetch household name
      const { data: hh } = await (supabase as any)
        .from("households")
        .select("name")
        .eq("id", data.household_id)
        .maybeSingle();
      return { ...data, household_name: hh?.name ?? "a household" };
    },
    enabled: !!token,
  });
}

export function useAcceptInvitation() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (token: string) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await (supabase as any).rpc("accept_household_invitation", {
        _token: token,
        _user_id: user.id,
        _user_name:
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          user.email?.split("@")[0] ||
          "Member",
        _user_email: user.email ?? "",
      });
      if (error) throw error;
      return data as string; // household_id
    },
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

export function buildInviteUrl(token: string) {
  return `${window.location.origin}/invite/${token}`;
}
