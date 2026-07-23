import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { supabase } from "@/integrations/supabase/client";

type OAuthProvider = "google" | "apple" | "microsoft" | "lovable";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const OAUTH_STATE_STORAGE_KEY = "wealthos_oauth_state";

const getSupportedOAuthOrigins = () => {
  const origins = new Set(["https://oauth.lovable.app", "https://lovable.dev"]);

  if (typeof window !== "undefined") {
    origins.add(window.location.origin);
  }

  return [...origins];
};

export const signInWithManagedOAuth = async (provider: OAuthProvider, opts?: SignInOptions) => {
  const auth = createLovableAuth({
    supportedOAuthOrigins: getSupportedOAuthOrigins(),
  });

  const originalOpen = window.open.bind(window);
  window.open = ((url?: string | URL, target?: string, features?: string) => {
    if (url) {
      const parsed = new URL(String(url), window.location.origin);
      const state = parsed.searchParams.get("state");
      if (state) localStorage.setItem(OAUTH_STATE_STORAGE_KEY, state);
    }

    return originalOpen(url, target, features);
  }) as typeof window.open;

  const result = await auth
    .signInWithOAuth(provider, {
      redirect_uri: opts?.redirect_uri,
      extraParams: opts?.extraParams,
    })
    .finally(() => {
      window.open = originalOpen;
    });

  if (result.redirected || result.error) {
    return result;
  }

  try {
    await supabase.auth.setSession(result.tokens);
    localStorage.removeItem(OAUTH_STATE_STORAGE_KEY);
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  return result;
};