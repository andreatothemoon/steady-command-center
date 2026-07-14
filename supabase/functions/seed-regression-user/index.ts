// Seeds (or resets) the dedicated regression test user + household.
// Gated by SEED_ADMIN_TOKEN so it cannot be invoked casually.
// Called by tests/regression/seed/seed.ts before the Playwright suite runs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-seed-token",
};

const TEST_EMAIL = "regression@wealthos.test";
const TEST_PASSWORD = "RegressionTest2026!";
const HOUSEHOLD_NAME = "Regression Household";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const token = req.headers.get("x-seed-token");
    const expected = Deno.env.get("SEED_ADMIN_TOKEN");
    if (!expected || token !== expected) {
      return json({ error: "unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode ?? "seed"; // "seed" | "reset"

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // 1. Ensure user exists with known password
    const { data: existing } = await supabase.auth.admin.listUsers();
    let userId = existing.users.find((u) => u.email === TEST_EMAIL)?.id;

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
      // Force password back to canonical value in case a previous test mutated it.
      await supabase.auth.admin.updateUserById(userId, {
        password: TEST_PASSWORD,
        email_confirm: true,
      });
    }

    // 2. Approve user + set role
    await supabase.from("user_approvals").upsert({
      user_id: userId,
      status: "approved",
    });
    await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role: "user" }, { onConflict: "user_id,role" });

    // 3. Household — find (or create) the one owned by our user with the canonical name
    let householdId: string | null = null;
    const { data: memberships } = await supabase
      .from("household_members")
      .select("household_id, role, households(name)")
      .eq("user_id", userId);

    const ownedRegression = (memberships ?? []).find(
      (m: any) => m.role === "owner" && m.households?.name === HOUSEHOLD_NAME,
    );
    if (ownedRegression) {
      householdId = ownedRegression.household_id;
    } else {
      const { data: h, error: hErr } = await supabase
        .from("households")
        .insert({ name: HOUSEHOLD_NAME })
        .select("id")
        .single();
      if (hErr) throw hErr;
      householdId = h.id;
      await supabase.from("household_members").insert({
        household_id: householdId,
        user_id: userId,
        role: "owner",
      });
    }

    // 4. Wipe existing test-household data (idempotent, keeps user & household)
    await supabase.from("account_snapshots").delete().in(
      "account_id",
      (await supabase
        .from("accounts")
        .select("id")
        .eq("household_id", householdId!)).data?.map((a) => a.id) ?? [],
    );
    await supabase.from("holdings").delete().in(
      "account_id",
      (await supabase
        .from("accounts")
        .select("id")
        .eq("household_id", householdId!)).data?.map((a) => a.id) ?? [],
    );
    await supabase.from("cash_flows").delete().eq("household_id", householdId);
    await supabase.from("db_accrual_slices").delete().in(
      "pension_id",
      (await supabase
        .from("db_pensions")
        .select("id")
        .eq("household_id", householdId!)).data?.map((p) => p.id) ?? [],
    );
    await supabase.from("db_pensions").delete().eq("household_id", householdId);
    await supabase.from("accounts").delete().eq("household_id", householdId);
    await supabase.from("household_profiles").delete().eq(
      "household_id",
      householdId,
    );

    if (mode === "reset") {
      return json({ ok: true, mode, userId, householdId });
    }

    // 5. Seed profiles
    const { data: profs } = await supabase
      .from("household_profiles")
      .insert([
        {
          household_id: householdId,
          name: "Test Adult A",
          role: "adult",
          is_primary: true,
        },
        {
          household_id: householdId,
          name: "Test Adult B",
          role: "adult",
          is_primary: false,
        },
        {
          household_id: householdId,
          name: "Test Child",
          role: "child",
          is_primary: false,
        },
      ])
      .select("id, name");
    const adultA = profs?.find((p) => p.name === "Test Adult A")?.id;
    const adultB = profs?.find((p) => p.name === "Test Adult B")?.id;

    // 6. Seed accounts
    const { data: accts } = await supabase
      .from("accounts")
      .insert([
        {
          household_id: householdId,
          owner_profile_id: adultA,
          name: "Test Current",
          type: "current",
          balance: 4200,
          currency: "GBP",
          last_updated: new Date().toISOString(),
        },
        {
          household_id: householdId,
          owner_profile_id: adultA,
          name: "Test ISA",
          type: "isa",
          balance: 28500,
          currency: "GBP",
          last_updated: new Date().toISOString(),
        },
        {
          household_id: householdId,
          owner_profile_id: adultB,
          name: "Test SIPP",
          type: "sipp",
          balance: 61000,
          currency: "GBP",
          last_updated: new Date().toISOString(),
        },
        {
          household_id: householdId,
          owner_profile_id: adultA,
          name: "Test Property",
          type: "property",
          balance: 425000,
          currency: "GBP",
          last_updated: new Date().toISOString(),
        },
        {
          household_id: householdId,
          owner_profile_id: adultA,
          name: "Test Mortgage",
          type: "mortgage",
          balance: -210000,
          currency: "GBP",
          last_updated: new Date().toISOString(),
        },
      ])
      .select("id, name");

    // 7. Snapshots for two prior months
    if (accts?.length) {
      const now = new Date();
      const snaps: any[] = [];
      accts.forEach((a) => {
        for (let i = 1; i <= 2; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          snaps.push({
            account_id: a.id,
            snapshot_date: d.toISOString().slice(0, 10),
            balance: Math.random() * 1000 + 1000,
            currency: "GBP",
          });
        }
      });
      await supabase.from("account_snapshots").insert(snaps);
    }

    // 8. Cash flows
    await supabase.from("cash_flows").insert([
      {
        household_id: householdId,
        profile_id: adultA,
        type: "income",
        category: "salary",
        amount: 65000,
        tax_year_start: "2025-04-06",
        description: "Test salary",
      },
      {
        household_id: householdId,
        profile_id: adultA,
        type: "pension_contribution",
        category: "employer",
        amount: 5200,
        tax_year_start: "2025-04-06",
        description: "Employer pension",
      },
      {
        household_id: householdId,
        profile_id: adultB,
        type: "income",
        category: "salary",
        amount: 48000,
        tax_year_start: "2025-04-06",
        description: "Test salary B",
      },
    ]);

    // 9. One DB pension
    const { data: pension } = await supabase
      .from("db_pensions")
      .insert({
        household_id: householdId,
        profile_id: adultA,
        scheme_name: "Test Career Average Scheme",
        pension_type: "care",
        normal_retirement_age: 67,
        accrual_rate: 0.019,
        revaluation_rate: 0.02,
      })
      .select("id")
      .single();

    if (pension?.id) {
      await supabase.from("db_accrual_slices").insert([
        {
          pension_id: pension.id,
          tax_year_start: "2023-04-06",
          pensionable_earnings: 55000,
          accrual_rate: 0.019,
        },
        {
          pension_id: pension.id,
          tax_year_start: "2024-04-06",
          pensionable_earnings: 60000,
          accrual_rate: 0.019,
        },
        {
          pension_id: pension.id,
          tax_year_start: "2025-04-06",
          pensionable_earnings: 65000,
          accrual_rate: 0.019,
        },
      ]);
    }

    return json({
      ok: true,
      mode,
      userId,
      householdId,
      accounts: accts?.length ?? 0,
    });
  } catch (e) {
    console.error("seed-regression-user error", e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
