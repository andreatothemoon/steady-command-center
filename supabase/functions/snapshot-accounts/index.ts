import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  // Only allow POST
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200 });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Fetch all accounts across all households
    const { data: accounts, error: accErr } = await supabase
      .from("accounts")
      .select("id, current_value");

    if (accErr) throw accErr;
    if (!accounts || accounts.length === 0) {
      return new Response(JSON.stringify({ message: "No accounts to snapshot" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build snapshot rows
    const rows = accounts.map((a: { id: string; current_value: number }) => ({
      account_id: a.id,
      balance: a.current_value,
      snapshot_date: today,
    }));

    // Upsert to avoid duplicates if run multiple times on same day
    const { error: insertErr } = await supabase
      .from("account_snapshots")
      .upsert(rows, { onConflict: "account_id,snapshot_date", ignoreDuplicates: true });

    if (insertErr) throw insertErr;

    return new Response(
      JSON.stringify({ message: `Snapshotted ${rows.length} accounts for ${today}` }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
