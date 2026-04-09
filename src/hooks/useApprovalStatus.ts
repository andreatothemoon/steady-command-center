import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useApprovalStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["approval-status", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_approvals")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.status as string | null;
    },
    enabled: !!user,
  });
}

export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-role-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: ["pending-approvals"],
    queryFn: async () => {
      const { data: approvals, error } = await supabase
        .from("user_approvals")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Fetch emails via secure RPC
      const withEmails = await Promise.all(
        (approvals ?? []).map(async (a) => {
          const { data: email } = await supabase.rpc("get_user_email", { _user_id: a.user_id });
          return { ...a, email: email as string | null };
        })
      );
      return withEmails;
    },
  });
}
