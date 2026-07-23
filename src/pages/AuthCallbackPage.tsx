import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { OAUTH_STATE_STORAGE_KEY } from "@/lib/lovableOAuth";

const OAUTH_COMPLETE_MESSAGE = "wealthos_oauth_complete";

const getOAuthParams = () => {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);

  return {
    accessToken: hashParams.get("access_token") ?? queryParams.get("access_token"),
    refreshToken: hashParams.get("refresh_token") ?? queryParams.get("refresh_token"),
    state:
      hashParams.get("state") ??
      queryParams.get("state") ??
      localStorage.getItem(OAUTH_STATE_STORAGE_KEY),
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

    const notifyOpener = (tokens?: { access_token: string; refresh_token: string }, state?: string | null) => {
      localStorage.setItem(OAUTH_COMPLETE_MESSAGE, String(Date.now()));
      localStorage.removeItem(OAUTH_STATE_STORAGE_KEY);

      if (window.opener && !window.opener.closed) {
        if (tokens) {
          window.opener.postMessage(
            {
              type: "authorization_response",
              response: {
                state,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
              },
            },
            window.location.origin,
          );
        }

        window.opener.postMessage({ type: OAUTH_COMPLETE_MESSAGE }, window.location.origin);
      }
    };

    const complete = async () => {
      const { accessToken, refreshToken, state, code, error } = getOAuthParams();
      let tokens: { access_token: string; refresh_token: string } | undefined;

      if (error) throw new Error(error);

      if (accessToken && refreshToken) {
        tokens = { access_token: accessToken, refresh_token: refreshToken };
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
      } else if (code) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
        if (data.session) {
          tokens = {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          };
        }
      }

      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user) throw userError ?? new Error("No authenticated user returned");

      notifyOpener(tokens, state);

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