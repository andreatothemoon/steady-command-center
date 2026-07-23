import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { supabase } from "@/integrations/supabase/client";

type OAuthProvider = "google" | "apple" | "microsoft" | "lovable";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

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

  const result = await auth.signInWithOAuth(provider, {
    redirect_uri: opts?.redirect_uri,
    extraParams: opts?.extraParams,
  });

  if (result.redirected || result.error) {
    return result;
  }

  try {
    await supabase.auth.setSession(result.tokens);
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  return result;
};