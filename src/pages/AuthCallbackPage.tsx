import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AUTH_CALLBACK_MESSAGE = "wealthos:auth-callback";

const getOAuthParams = () => {
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  hashParams.forEach((value, key) => {
    if (!params.has(key)) params.set(key, value);
  });

  return params;
};

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Completing Google sign-in…");

  useEffect(() => {
    let cancelled = false;

    const finishSignIn = async () => {
      const params = getOAuthParams();
      const error = params.get("error_description") ?? params.get("error");

      if (error) {
        setMessage(error);
        window.setTimeout(() => navigate("/auth", { replace: true }), 1800);
        return;
      }

      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const code = params.get("code");

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

      if (window.location.search || window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname);
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (userError || !user) {
        setMessage(userError?.message ?? "Google sign-in could not be completed. Please try again.");
        window.setTimeout(() => navigate("/auth", { replace: true }), 1800);
        return;
      }

      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: AUTH_CALLBACK_MESSAGE }, window.location.origin);
        setMessage("Google sign-in complete. You can close this window.");
        window.setTimeout(() => window.close(), 250);
        return;
      }

      navigate("/", { replace: true });
    };

    void finishSignIn().catch((error) => {
      if (cancelled) return;
      setMessage(error instanceof Error ? error.message : "Google sign-in could not be completed.");
      window.setTimeout(() => navigate("/auth", { replace: true }), 1800);
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="dark min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mx-auto">
          <span className="text-primary-foreground font-bold text-lg">W</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">WealthOS</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}