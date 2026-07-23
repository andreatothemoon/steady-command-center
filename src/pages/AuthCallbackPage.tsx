import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const OAUTH_COMPLETE_MESSAGE = "wealthos_oauth_complete";

const getOAuthParams = () => {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);

  return {
    accessToken: hashParams.get("access_token") ?? queryParams.get("access_token"),
    refreshToken: hashParams.get("refresh_token") ?? queryParams.get("refresh_token"),
    code: queryParams.get("code") ?? hashParams.get("code"),
    error:
      queryParams.get("error_description") ??
      hashParams.get("error_description") ??
      queryParams.get("error") ??
      hashParams.get("error"),
  };
};

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Completing sign in…");

  useEffect(() => {
    let active = true;

    const notifyOpener = () => {
      localStorage.setItem(OAUTH_COMPLETE_MESSAGE, String(Date.now()));

      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: OAUTH_COMPLETE_MESSAGE }, window.location.origin);
      }
    };

    const complete = async () => {
      const { accessToken, refreshToken, code, error } = getOAuthParams();

      if (error) throw new Error(error);

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
      } else if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
      }

      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user) throw userError ?? new Error("No authenticated user returned");

      notifyOpener();

      if (!active) return;
      setMessage("Signed in. Redirecting…");

      if (window.opener && !window.opener.closed) {
        window.close();
      }

      navigate("/", { replace: true });
    };

    complete().catch((error) => {
      if (!active) return;
      console.error("Google callback failed", error);
      setMessage("Google sign in could not be completed. Please close this window and try again.");
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="dark min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mx-auto">
          <span className="text-primary-foreground font-bold text-lg">W</span>
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">WealthOS</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}