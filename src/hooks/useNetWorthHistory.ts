import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subMonths, parseISO } from "date-fns";
import type { Account } from "@/hooks/useAccounts";

export interface NetWorthPoint {
  month: string;
  value: number;
}

export function useNetWorthHistory(accounts: Account[]) {
  const { householdId } = useAuth();

  return useQuery({
    queryKey: ["net_worth_history", householdId],
    queryFn: async (): Promise<NetWorthPoint[]> => {
      if (!householdId) return [];

      const { data: snapshots, error } = await supabase
        .from("account_snapshots")
        .select("snapshot_date, balance, account_id")
        .in("account_id", accounts.map((a) => a.id))
        .order("snapshot_date", { ascending: true });

      if (error) throw error;

      if (!snapshots || snapshots.length === 0) {
        // No historical data — return current net worth as single point
        const netWorth = accounts.reduce((s, a) => s + Number(a.current_value), 0);
        return [{ month: format(new Date(), "MMM yy"), value: netWorth }];
      }

      // Group by snapshot_date, sum balances per date
      const dateMap = new Map<string, number>();
      for (const snap of snapshots) {
        const key = snap.snapshot_date;
        dateMap.set(key, (dateMap.get(key) ?? 0) + snap.balance);
      }

      // Convert to sorted array
      const points: NetWorthPoint[] = Array.from(dateMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => ({
          month: format(parseISO(date), "MMM yy"),
          value,
        }));

      return points;
    },
    enabled: !!householdId && accounts.length > 0,
  });
}

export function filterByTimeRange(points: NetWorthPoint[], range: "3M" | "6M" | "12M" | "ALL") {
  if (range === "ALL") return points;
  const count = range === "3M" ? 3 : range === "6M" ? 6 : 12;
  return points.slice(-count);
}
