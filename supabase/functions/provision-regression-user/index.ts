// Idempotently provisions the regression test user via Supabase auth admin API.
// Hard-coded to the fixed regression email so there is nothing an attacker
// could do with this endpoint beyond re-creating that specific test account.
// Called by the regression Playwright globalSetup.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_EMAIL = "regression@wealthos.test";
const TEST_PASSWORD = "RegressionTest2026!";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Find or create the test user via the admin API (proper hashing + identities)
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) throw listErr;
    let userId = list.users.find((u) => u.email === TEST_EMAIL)?.id;

    if (!userId) {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "Regression Tester" },
      });
      if (error) throw error;
      userId = created.user!.id;
    } else {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: TEST_PASSWORD,
        email_confirm: true,
      });
      if (error) throw error;
    }

    // Ensure approval + role rows
    await supabase.from("user_approvals").upsert({ user_id: userId, status: "approved" });
    await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role: "user" }, { onConflict: "user_id,role" });

    return json({ ok: true, userId });
  } catch (e: any) {
    console.error("provision-regression-user error", e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
