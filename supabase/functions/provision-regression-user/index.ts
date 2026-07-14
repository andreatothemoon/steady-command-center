// Idempotently provisions the regression test user AND seeds their household
// with a canonical set of profiles, accounts, snapshots, cash flows, and a
// DB pension. Safe to re-run; only ever touches the fixed regression email
// and its associated "Regression Household".
//
// Called by tests/regression/globalSetup.ts (once per run) and by every test
// that mutates data (via the resetSeed() fixture) so ordering is irrelevant.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_EMAIL = "regression@wealthos.test";
const TEST_PASSWORD = "RegressionTest2026!";
const HOUSEHOLD_NAME = "Regression Household";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // 1. Ensure the auth user exists with the canonical password
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
      // Do NOT update password on repeat calls — that invalidates active sessions
      // and breaks the storageState the Playwright suite reuses. Only ensure the
      // email is confirmed (idempotent).
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });
      if (error) throw error;
    }

    // 2. Approve + role (explicit onConflict — both tables have unique(user_id[, role]))
    await supabase
      .from("user_approvals")
      .upsert({ user_id: userId, status: "approved" }, { onConflict: "user_id" });
    await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role: "user" }, { onConflict: "user_id,role" });

    // 3. Ensure the regression household exists (owned by our user)
    // Take over any existing owned household (renaming if needed) so the
    // handle_new_user trigger's default "My Household" doesn't cause duplicates.
    const { data: memberships } = await supabase
      .from("household_members")
      .select("household_id, role, households(name)")
      .eq("user_id", userId);

    let householdId: string | null = null;
    const owned = (memberships ?? []).find((m: any) => m.role === "owner");
    if (owned) {
      householdId = owned.household_id;
      if (owned.households?.name !== HOUSEHOLD_NAME) {
        await supabase.from("households").update({ name: HOUSEHOLD_NAME }).eq("id", householdId);
      }
    } else {
      const { data: h, error: hErr } = await supabase
        .from("households")
        .insert({ name: HOUSEHOLD_NAME })
        .select("id")
        .single();
      if (hErr) throw hErr;
      householdId = h.id;
      await supabase
        .from("household_members")
        .insert({ household_id: householdId, user_id: userId, role: "owner" });
    }

    // 4. Wipe seeded rows
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
    await supabase.from("household_profiles").delete().eq("household_id", householdId);

    // 5. Profiles
    await supabase.from("household_profiles").insert([
      { household_id: householdId, name: "Test Adult A", role: "adult", is_primary: true },
      { household_id: householdId, name: "Test Adult B", role: "adult", is_primary: false },
      { household_id: householdId, name: "Test Child", role: "child", is_primary: false },
    ]);

    // 6. Accounts
    const now = new Date().toISOString();
    const { data: accts, error: acctErr } = await supabase
      .from("accounts")
      .insert([
        { household_id: householdId, owner_name: "Test Adult A", name: "Test Current",   account_type: "current_account",       wrapper_type: "none", current_value: 4200,   last_updated: now },
        { household_id: householdId, owner_name: "Test Adult A", name: "Test ISA",       account_type: "stocks_and_shares_isa", wrapper_type: "isa",  current_value: 28500,  last_updated: now },
        { household_id: householdId, owner_name: "Test Adult B", name: "Test SIPP",      account_type: "sipp",                  wrapper_type: "sipp", current_value: 61000,  last_updated: now },
        { household_id: householdId, owner_name: "Test Adult A", name: "Test Property",  account_type: "property",              wrapper_type: "none", current_value: 425000, last_updated: now },
        { household_id: householdId, owner_name: "Test Adult A", name: "Test Mortgage",  account_type: "mortgage",              wrapper_type: "none", current_value: -210000, last_updated: now },
      ])
      .select("id, name");
    if (acctErr) throw acctErr;

    // 7. Snapshots (2 months back per account)
    if (accts?.length) {
      const today = new Date();
      const snaps: any[] = [];
      accts.forEach((a) => {
        for (let i = 1; i <= 2; i++) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          snaps.push({
            account_id: a.id,
            snapshot_date: d.toISOString().slice(0, 10),
            balance: 1400 + i * 100,
          });
        }
      });
      await supabase.from("account_snapshots").insert(snaps);
    }

    // 8. Cash flows
    await supabase.from("cash_flows").insert([
      { household_id: householdId, flow_type: "income",               amount: 65000, flow_date: "2025-05-01", description: "Test salary",       tag: "salary" },
      { household_id: householdId, flow_type: "pension_contribution", amount: 5200,  flow_date: "2025-05-01", description: "Employer pension",  tag: "employer" },
      { household_id: householdId, flow_type: "income",               amount: 48000, flow_date: "2025-05-01", description: "Test salary B",     tag: "salary" },
    ]);

    // 9. DB pension + slices
    const { data: pension, error: pErr } = await supabase
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
    if (pErr) throw pErr;

    if (pension?.id) {
      await supabase.from("db_accrual_slices").insert([
        { pension_id: pension.id, year: 2023, pensionable_salary: 55000, accrual_rate: 54, pension_earned: 55000 / 54, revalued_value: 55000 / 54 },
        { pension_id: pension.id, year: 2024, pensionable_salary: 60000, accrual_rate: 54, pension_earned: 60000 / 54, revalued_value: 60000 / 54 },
        { pension_id: pension.id, year: 2025, pensionable_salary: 65000, accrual_rate: 54, pension_earned: 65000 / 54, revalued_value: 65000 / 54 },
      ]);
    }

    return json({ ok: true, userId, householdId, accounts: accts?.length ?? 0 });
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
