import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function PendingApprovalPage() {
  const { signOut, user } = useAuth();

  return (
    <div className="dark min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
          <Clock className="h-8 w-8 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Account Pending Approval
          </h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            Your account has been created successfully. An administrator needs to approve your access before you can use WealthOS.
          </p>
          {user?.email && (
            <p className="text-sm text-muted-foreground mt-3">
              Signed up as <span className="text-foreground font-medium">{user.email}</span>
            </p>
          )}
        </div>
        <Button variant="outline" onClick={signOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
