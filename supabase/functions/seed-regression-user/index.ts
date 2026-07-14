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

    // 4. Wipe existing test-household data (idempotent)
    const { data: acctIds } = await supabase
      .from("accounts")
      .select("id")
      .eq("household_id", householdId!);
    const accountIdList = (acctIds ?? []).map((a) => a.id);

    const { data: pensionIds } = await supabase
      .from("db_pensions")
      .select("id")
      .eq("household_id", householdId!);
    const pensionIdList = (pensionIds ?? []).map((p) => p.id);

    if (accountIdList.length) {
      await supabase.from("account_snapshots").delete().in("account_id", accountIdList);
      await supabase.from("holdings").delete().in("account_id", accountIdList);
    }
    await supabase.from("cash_flows").delete().eq("household_id", householdId);
    if (pensionIdList.length) {
      await supabase.from("db_accrual_slices").delete().in("pension_id", pensionIdList);
    }
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
    await supabase.from("household_profiles").insert([
      { household_id: householdId, name: "Test Adult A", role: "adult", is_primary: true },
      { household_id: householdId, name: "Test Adult B", role: "adult", is_primary: false },
      { household_id: householdId, name: "Test Child", role: "child", is_primary: false },
    ]);

    // 6. Seed accounts (real schema)
    const now = new Date().toISOString();
    const { data: accts } = await supabase
      .from("accounts")
      .insert([
        {
          household_id: householdId,
          owner_name: "Test Adult A",
          name: "Test Current",
          account_type: "current_account",
          wrapper_type: "none",
          current_value: 4200,
          last_updated: now,
        },
        {
          household_id: householdId,
          owner_name: "Test Adult A",
          name: "Test ISA",
          account_type: "stocks_and_shares_isa",
          wrapper_type: "isa",
          current_value: 28500,
          last_updated: now,
        },
        {
          household_id: householdId,
          owner_name: "Test Adult B",
          name: "Test SIPP",
          account_type: "sipp",
          wrapper_type: "sipp",
          current_value: 61000,
          last_updated: now,
        },
        {
          household_id: householdId,
          owner_name: "Test Adult A",
          name: "Test Property",
          account_type: "property",
          wrapper_type: "none",
          current_value: 425000,
          last_updated: now,
        },
        {
          household_id: householdId,
          owner_name: "Test Adult A",
          name: "Test Mortgage",
          account_type: "mortgage",
          wrapper_type: "none",
          current_value: -210000,
          last_updated: now,
        },
      ])
      .select("id, name");

    // 7. Snapshots for two prior months
    if (accts?.length) {
      const today = new Date();
      const snaps: any[] = [];
      accts.forEach((a) => {
        for (let i = 1; i <= 2; i++) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          snaps.push({
            account_id: a.id,
            snapshot_date: d.toISOString().slice(0, 10),
            balance: Math.round(Math.random() * 1000 + 1000),
          });
        }
      });
      await supabase.from("account_snapshots").insert(snaps);
    }

    // 8. Cash flows
    await supabase.from("cash_flows").insert([
      {
        household_id: householdId,
        flow_type: "income",
        amount: 65000,
        flow_date: "2025-05-01",
        description: "Test salary",
        tag: "salary",
      },
      {
        household_id: householdId,
        flow_type: "pension_contribution",
        amount: 5200,
        flow_date: "2025-05-01",
        description: "Employer pension",
        tag: "employer",
      },
      {
        household_id: householdId,
        flow_type: "income",
        amount: 48000,
        flow_date: "2025-05-01",
        description: "Test salary B",
        tag: "salary",
      },
    ]);

    // 9. One DB pension
    const { data: pension } = await supabase
      .from("db_pensions")
      .insert({
        household_id: householdId,
        name: "Test Career Average",
        scheme_type: "CARE",
        current_age: 42,
        retirement_age: 67,
        current_salary: 65000,
        salary_growth_rate: 0.03,
        accrual_rate: 54,
        revaluation_type: "CPI",
        revaluation_rate: 0.02,
        indexation_type: "CPI",
      })
      .select("id")
      .single();

    if (pension?.id) {
      await supabase.from("db_accrual_slices").insert([
        { pension_id: pension.id, year: 2023, pensionable_salary: 55000, accrual_rate: 54, pension_earned: 55000 / 54, revalued_value: 55000 / 54 },
        { pension_id: pension.id, year: 2024, pensionable_salary: 60000, accrual_rate: 54, pension_earned: 60000 / 54, revalued_value: 60000 / 54 },
        { pension_id: pension.id, year: 2025, pensionable_salary: 65000, accrual_rate: 54, pension_earned: 65000 / 54, revalued_value: 65000 / 54 },
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
