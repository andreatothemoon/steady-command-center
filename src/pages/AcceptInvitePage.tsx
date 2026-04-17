import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Users, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useInvitationByToken, useAcceptInvitation } from "@/hooks/useHouseholdInvitations";
import { toast } from "sonner";

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: invite, isLoading } = useInvitationByToken(token ?? null);
  const accept = useAcceptInvitation();

  // Persist token so it survives the signup/login round-trip
  useEffect(() => {
    if (token) sessionStorage.setItem("pending_invitation_token", token);
  }, [token]);

  const isExpired = invite && new Date(invite.expires_at) < new Date();
  const isPending = invite?.status === "pending" && !isExpired;

  const handleAccept = async () => {
    if (!token) return;
    if (!user) {
      navigate(`/auth?invite=${token}`);
      return;
    }
    try {
      await accept.mutateAsync(token);
      sessionStorage.removeItem("pending_invitation_token");
      toast.success(`Welcome to ${invite?.household_name}!`);
      navigate("/");
    } catch (e: any) {
      toast.error(e.message || "Failed to accept invitation");
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="dark min-h-screen bg-background flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border border-border bg-card animate-pulse" />
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
          <Users className="h-7 w-7 text-primary" />
        </div>

        {!invite ? (
          <>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Invitation not found</h1>
              <p className="text-sm text-muted-foreground mt-2">
                This invite link is invalid or no longer exists.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/auth")}>
              Go to sign in
            </Button>
          </>
        ) : !isPending ? (
          <>
            <div className="h-10 w-10 rounded-full bg-destructive/15 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Invitation unavailable</h1>
              <p className="text-sm text-muted-foreground mt-2">
                {isExpired
                  ? "This invitation has expired. Ask the household owner to send a new one."
                  : invite.status === "accepted"
                  ? "This invitation has already been used."
                  : "This invitation has been revoked."}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/auth")}>
              Go to sign in
            </Button>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Join {invite.household_name}
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                You've been invited to share full access to this household — accounts, pensions, tax and retirement plans.
              </p>
            </div>

            {user ? (
              <Button className="w-full gap-2" onClick={handleAccept} disabled={accept.isPending}>
                <Check className="h-4 w-4" />
                {accept.isPending ? "Joining…" : "Accept invitation"}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button className="w-full" onClick={() => navigate(`/auth?invite=${token}&mode=signup`)}>
                  Create account & join
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate(`/auth?invite=${token}`)}>
                  Sign in to join
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
