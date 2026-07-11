/**
 * Wealth Map — visual hierarchy of the same buckets used on the Wealth page.
 * Household → Member → Bucket (Guaranteed / Growth / Safety / Property & Debt) → Account.
 * Values mirror WealthPage: DB pensions show projected income, guaranteed bucket
 * shows estimated annual income, others show balances.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { motion } from "framer-motion";
import {
  Users,
  User,
  Shield,
  TrendingUp,
  Landmark,
  Home as HomeIcon,
  Wallet,
  PiggyBank,
  Banknote,
  CreditCard,
  Building2,
  Bitcoin,
  GripVertical,
  type LucideIcon,
} from "lucide-react";
import { useAccounts, useUpdateAccount, type Account } from "@/hooks/useAccounts";
import { useDBPensions } from "@/hooks/useDBPensions";
import type { DBPension } from "@/hooks/useDBPensions";
import { useHouseholdProfiles } from "@/hooks/useHouseholdProfiles";
import { projectDBPension } from "@/lib/dbPensionEngine";
import { toDBPensionParams } from "@/lib/dbPensionRates";
import { DEFAULT_DRAWDOWN_RATE } from "@/lib/retirementEngine";
import { splitOwnerNames } from "@/lib/accountOwners";
import { formatCurrency } from "@/lib/format";
import { toast } from "@/hooks/use-toast";

/* ─── Buckets mirror WealthPage ─── */
type Bucket = "guaranteed" | "growth" | "safety" | "property";

/* Bucket accent colors mirror WealthPage donut / allocation story */
const BUCKET_COLOR: Record<Bucket, string> = {
  guaranteed: "#091540",
  growth: "#efcb68",
  safety: "#aeb7b3",
  property: "#895b1e",
};

const BUCKETS: {
  key: Bucket;
  label: string;
  icon: LucideIcon;
  types: string[];
  description: string;
}[] = [
  {
    key: "guaranteed",
    label: "Guaranteed Income",
    icon: Shield,
    types: ["db_pension", "workplace_pension", "sipp"],
    description: "Pensions & annuities",
  },
  {
    key: "growth",
    label: "Growth Assets",
    icon: TrendingUp,
    types: ["stocks_and_shares_isa", "cash_isa", "gia", "crypto", "employer_share_scheme"],
    description: "Invested drawdown capacity",
  },
  {
    key: "safety",
    label: "Safety Net",
    icon: Landmark,
    types: ["current_account", "savings"],
    description: "Cash & short-term savings",
  },
  {
    key: "property",
    label: "Property & Debt",
    icon: HomeIcon,
    types: ["property", "mortgage", "loan", "credit_card"],
    description: "Property equity & liabilities",
  },
];

function toBucket(type: string): Bucket {
  return BUCKETS.find((b) => b.types.includes(type))?.key ?? "growth";
}

const ACCOUNT_ICON: Record<string, LucideIcon> = {
  current_account: Banknote,
  savings: Banknote,
  cash_isa: Wallet,
  stocks_and_shares_isa: Wallet,
  gia: TrendingUp,
  employer_share_scheme: TrendingUp,
  sipp: PiggyBank,
  workplace_pension: PiggyBank,
  db_pension: Shield,
  property: HomeIcon,
  mortgage: Building2,
  loan: Landmark,
  credit_card: CreditCard,
  crypto: Bitcoin,
};

type NodeKind = "root" | "member" | "bucket" | "account";

interface NodeMeta {
  kind: NodeKind;
  label: string;
  sublabel?: string;
  count?: number;
  color: string; // CSS color (hex or hsl()) for icon + ring tint
  icon: LucideIcon;
  accountId?: string;
  memberId?: string;
  bucket?: Bucket;
  isNegative?: boolean;
}

const NODE_WIDTH = 320;
const NODE_HEIGHT = 96;

function WealthNode({ data, selected }: NodeProps) {
  const meta = data as unknown as NodeMeta;
  const Icon = meta.icon;
  const isRoot = meta.kind === "root";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group relative flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm"
      style={{
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
        boxShadow: `0 1px 2px hsl(var(--foreground) / 0.04), 0 8px 24px -12px ${meta.color}40`,
        outline: selected ? `2px solid hsl(var(--ring))` : `1px solid ${meta.color}33`,
        outlineOffset: selected ? 0 : -1,
      }}
    >
      {!isRoot && <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-border" />}
      {meta.kind !== "account" && (
        <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-border" />
      )}

      <span
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
      >
        <Icon className="h-5 w-5" strokeWidth={2.25} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold leading-tight text-foreground">{meta.label}</p>
        {meta.sublabel && (
          <p
            className={`mt-0.5 truncate text-[13px] tabular-nums ${
              meta.isNegative ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {meta.sublabel}
          </p>
        )}
      </div>

      {typeof meta.count === "number" && meta.count > 0 && (
        <span
          className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold"
          style={{ backgroundColor: `${meta.color}26`, color: meta.color }}
        >
          {meta.count}
        </span>
      )}

      <GripVertical className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
    </motion.div>
  );
}

const nodeTypes = { wealth: WealthNode };

function layout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 120, marginx: 40, marginy: 40 });
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => {
    const p = g.node(n.id);
    return { ...n, position: { x: p.x - NODE_WIDTH / 2, y: p.y - NODE_HEIGHT / 2 } };
  });
}

/* ─── Value helpers aligned with WealthPage ─── */
function accountDisplayValue(a: Account, dbProjected?: number): number {
  if (a.account_type === "db_pension") return dbProjected ?? 0;
  return Number(a.current_value);
}

function accountBucketContribution(a: Account, bucket: Bucket, dbProjected?: number): number {
  if (a.account_type === "db_pension") return dbProjected ?? 0;
  const val = Number(a.current_value);
  if (bucket === "guaranteed" && val > 0) return Math.round(val * DEFAULT_DRAWDOWN_RATE);
  return val;
}

function formatWithSuffix(bucket: Bucket, total: number): string {
  const rounded = Math.round(total);
  return `${formatCurrency(rounded, true)}${bucket === "guaranteed" ? "/yr" : ""}`;
}

export default function WealthMapPage() {
  const { data: accounts = [] } = useAccounts();
  const { data: dbPensions = [] } = useDBPensions();
  const { data: profiles = [] } = useHouseholdProfiles();
  const adults = useMemo(() => profiles.filter((p) => p.role === "adult"), [profiles]);
  const updateAccount = useUpdateAccount();

  // DB pension projections keyed by account_id — same as WealthPage
  const dbProjections = useMemo(() => {
    const map: Record<string, { pension: DBPension; projected: number }> = {};
    dbPensions.forEach((p) => {
      if (p.account_id) {
        const params = toDBPensionParams(p);
        const result = projectDBPension(params);
        map[p.account_id] = { pension: p, projected: result.projected_annual_income };
      }
    });
    return map;
  }, [dbPensions]);

  const { initialNodes, initialEdges, netWorth } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const totalAssets = accounts
      .filter((a) => Number(a.current_value) > 0)
      .reduce((s, a) => s + Number(a.current_value), 0);
    const totalLiabilities = accounts
      .filter((a) => Number(a.current_value) < 0)
      .reduce((s, a) => s + Number(a.current_value), 0);
    const nw = totalAssets + totalLiabilities;

    nodes.push({
      id: "root",
      type: "wealth",
      position: { x: 0, y: 0 },
      data: {
        kind: "root",
        label: "Household",
        sublabel: `${formatCurrency(nw, true)} net worth`,
        count: accounts.length,
        icon: Users,
        color: "hsl(var(--primary))",
      } satisfies NodeMeta as unknown as Record<string, unknown>,
    });

    const memberList =
      adults.length > 0
        ? adults.map((a) => ({ id: a.id, name: a.name }))
        : [{ id: "unassigned", name: "Unassigned" }];

    memberList.forEach((m) => {
      const memberAccounts = accounts.filter((a) =>
        m.id === "unassigned"
          ? splitOwnerNames(a.owner_name).length === 0
          : splitOwnerNames(a.owner_name).includes(m.name.toLowerCase()),
      );
      if (memberAccounts.length === 0 && m.id !== "unassigned") return;

      const memberNet = memberAccounts.reduce((s, a) => s + Number(a.current_value), 0);
      const memberNodeId = `member:${m.id}`;

      nodes.push({
        id: memberNodeId,
        type: "wealth",
        position: { x: 0, y: 0 },
        data: {
          kind: "member",
          label: m.name,
          sublabel: `${formatCurrency(memberNet, true)} net`,
          count: memberAccounts.length,
          icon: User,
          color: "hsl(var(--primary))",
          memberId: m.id,
          isNegative: memberNet < 0,
        } satisfies NodeMeta as unknown as Record<string, unknown>,
      });
      edges.push({ id: `e:root-${memberNodeId}`, source: "root", target: memberNodeId, type: "smoothstep" });

      BUCKETS.forEach((bucket) => {
        const bucketAccounts = memberAccounts.filter((a) => toBucket(a.account_type) === bucket.key);
        if (bucketAccounts.length === 0) return;

        const bucketTotal = bucketAccounts.reduce(
          (s, a) => s + accountBucketContribution(a, bucket.key, dbProjections[a.id]?.projected),
          0,
        );
        const bucketNodeId = `bucket:${m.id}:${bucket.key}`;

        nodes.push({
          id: bucketNodeId,
          type: "wealth",
          position: { x: 0, y: 0 },
          data: {
            kind: "bucket",
            label: bucket.label,
            sublabel: formatWithSuffix(bucket.key, bucketTotal),
            count: bucketAccounts.length,
            icon: bucket.icon,
            color: BUCKET_COLOR[bucket.key],
            bucket: bucket.key,
            isNegative: bucketTotal < 0,
          } satisfies NodeMeta as unknown as Record<string, unknown>,
        });
        edges.push({
          id: `e:${memberNodeId}-${bucketNodeId}`,
          source: memberNodeId,
          target: bucketNodeId,
          type: "smoothstep",
        });

        bucketAccounts.forEach((a) => {
          const acctNodeId = `acct:${m.id}:${a.id}`;
          const displayVal = accountDisplayValue(a, dbProjections[a.id]?.projected);
          const suffix = a.account_type === "db_pension" ? "/yr projected" : "";

          nodes.push({
            id: acctNodeId,
            type: "wealth",
            position: { x: 0, y: 0 },
            data: {
              kind: "account",
              label: a.name,
              sublabel: `${formatCurrency(displayVal, true)}${suffix ? ` ${suffix}` : ""}`,
              icon: ACCOUNT_ICON[a.account_type] ?? Wallet,
              color: BUCKET_COLOR[bucket.key],
              accountId: a.id,
              memberId: m.id,
              bucket: bucket.key,
              isNegative: displayVal < 0,
            } satisfies NodeMeta as unknown as Record<string, unknown>,
          });
          edges.push({
            id: `e:${bucketNodeId}-${acctNodeId}`,
            source: bucketNodeId,
            target: acctNodeId,
            type: "smoothstep",
          });
        });
      });
    });

    const laid = layout(nodes, edges);
    const styledEdges: Edge[] = edges.map((e) => ({
      ...e,
      animated: false,
      style: { stroke: "hsl(215 20% 30%)", strokeWidth: 1.25 },
    }));

    return { initialNodes: laid, initialEdges: styledEdges, netWorth: nw };
  }, [accounts, adults, dbProjections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [draggingAccount, setDraggingAccount] = useState<Account | null>(null);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeDragStart = useCallback(
    (_e: MouseEvent | TouchEvent, node: Node) => {
      const meta = node.data as unknown as NodeMeta;
      if (meta.kind !== "account" || !meta.accountId) return;
      const acct = accounts.find((a) => a.id === meta.accountId) ?? null;
      setDraggingAccount(acct);
    },
    [accounts],
  );

  const onNodeDragStop = useCallback(
    (event: MouseEvent | TouchEvent, node: Node) => {
      const meta = node.data as unknown as NodeMeta;
      if (meta.kind !== "account" || !meta.accountId || !draggingAccount) {
        setDraggingAccount(null);
        return;
      }

      const point = "touches" in event ? event.changedTouches[0] : event;
      const el = document.elementFromPoint(point.clientX, point.clientY);
      const targetEl = el?.closest("[data-id]") as HTMLElement | null;
      const targetId = targetEl?.getAttribute("data-id");
      const target = targetId ? nodes.find((n) => n.id === targetId) : null;

      if (target && target.id !== node.id) {
        const targetMeta = target.data as unknown as NodeMeta;
        if (targetMeta.kind === "member" && targetMeta.memberId) {
          const member = adults.find((a) => a.id === targetMeta.memberId);
          if (member && !splitOwnerNames(draggingAccount.owner_name).includes(member.name.toLowerCase())) {
            updateAccount.mutate(
              { id: draggingAccount.id, owner_name: member.name },
              {
                onSuccess: () =>
                  toast({ title: "Reassigned", description: `${draggingAccount.name} → ${member.name}` }),
                onError: (err: unknown) =>
                  toast({
                    title: "Reassign failed",
                    description: err instanceof Error ? err.message : "Please try again",
                    variant: "destructive",
                  }),
              },
            );
          }
        }
      } else {
        setNodes((prev) =>
          prev.map((n) => {
            if (n.id !== node.id) return n;
            const orig = initialNodes.find((o) => o.id === n.id);
            return orig ? { ...n, position: orig.position } : n;
          }),
        );
      }
      setDraggingAccount(null);
    },
    [adults, draggingAccount, nodes, initialNodes, setNodes, updateAccount],
  );

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Wealth map</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Household → member → bucket → account. Same buckets as the Wealth page. Drag an account onto a member to reassign ownership.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[12px]">
          {BUCKETS.map((b) => {
            const Icon = b.icon;
            const color = BUCKET_COLOR[b.key];
            return (
              <span
                key={b.key}
                className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-muted-foreground"
                style={{ borderColor: `${color}33` }}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.25} style={{ color }} />
                <span className="text-foreground/80">{b.label}</span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="card-surface relative flex-1 overflow-hidden !p-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.05 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.15}
          maxZoom={3}
        >
          <Background color="hsl(var(--border))" gap={24} size={1} />
          <MiniMap
            className="!bg-card !border-border"
            maskColor="hsl(var(--background) / 0.85)"
            nodeColor="hsl(var(--secondary))"
            nodeStrokeColor="hsl(var(--border))"
          />
          <Controls className="!bg-card !border-border [&>button]:!bg-transparent [&>button]:!border-border [&>button]:!text-muted-foreground [&>button:hover]:!bg-secondary" />
        </ReactFlow>

        <div className="pointer-events-none absolute left-6 top-6 rounded-2xl border border-border/60 bg-card/90 px-4 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
          <span>Net worth</span>{" "}
          <span className="font-semibold text-foreground tabular-nums">{formatCurrency(netWorth, true)}</span>
        </div>

        {draggingAccount && (
          <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg">
            Drop on a member to reassign {draggingAccount.name}
          </div>
        )}
      </div>
    </div>
  );
}
