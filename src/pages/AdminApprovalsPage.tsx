import { usePendingApprovals } from "@/hooks/useApprovalStatus";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminApprovalsPage() {
  const { data: approvals, isLoading } = usePendingApprovals();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatus = async (approvalId: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("user_approvals")
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", approvalId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: `User ${status}` });
    queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
  };

  const statusColor = (s: string) => {
    if (s === "approved") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (s === "rejected") return "bg-red-500/10 text-red-400 border-red-500/20";
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold text-foreground">User Approvals</h1>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : !approvals?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No user signups yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {approvals.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {a.email ?? a.user_id}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusColor(a.status)}>
                      {a.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {a.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateStatus(a.id, "approved")} className="gap-1">
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "rejected")} className="gap-1">
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
