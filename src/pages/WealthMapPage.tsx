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
  Landmark,
  Users,
  User,
  Wallet,
  PiggyBank,
  Home,
  Banknote,
  CreditCard,
  Building2,
  Bitcoin,
  TrendingUp,
  GripVertical,
  type LucideIcon,
} from "lucide-react";
import { useAccounts, useUpdateAccount, type Account } from "@/hooks/useAccounts";
import { useHouseholdProfiles } from "@/hooks/useHouseholdProfiles";
import { splitOwnerNames } from "@/lib/accountOwners";
import { formatCurrency } from "@/lib/format";
import { toast } from "@/hooks/use-toast";

type NodeKind = "root" | "member" | "category" | "account";

interface NodeMeta {
  kind: NodeKind;
  label: string;
  sublabel?: string;
  count?: number;
  value?: number;
  accent: "amber" | "green" | "orange" | "violet" | "sky" | "rose" | "slate";
  icon: LucideIcon;
  accountType?: string;
  accountId?: string;
  memberId?: string;
  ownerName?: string;
}

const CATEGORIES: {
  key: string;
  label: string;
  icon: LucideIcon;
  accent: NodeMeta["accent"];
  types: string[];
}[] = [
  { key: "cash", label: "Cash", icon: Banknote, accent: "sky", types: ["current_account", "savings"] },
  { key: "isa", label: "ISAs", icon: Wallet, accent: "green", types: ["cash_isa", "stocks_and_shares_isa"] },
  { key: "investments", label: "Investments", icon: TrendingUp, accent: "amber", types: ["gia", "employer_share_scheme"] },
  { key: "pension", label: "Pensions", icon: PiggyBank, accent: "violet", types: ["sipp", "workplace_pension", "db_pension"] },
  { key: "property", label: "Property", icon: Home, accent: "orange", types: ["property"] },
  { key: "crypto", label: "Crypto", icon: Bitcoin, accent: "amber", types: ["crypto"] },
  { key: "debt", label: "Debt", icon: CreditCard, accent: "rose", types: ["mortgage", "loan", "credit_card"] },
];

const ACCOUNT_ICON: Record<string, LucideIcon> = {
  current_account: Banknote,
  savings: Banknote,
  cash_isa: Wallet,
  stocks_and_shares_isa: Wallet,
  gia: TrendingUp,
  employer_share_scheme: TrendingUp,
  sipp: PiggyBank,
  workplace_pension: PiggyBank,
  db_pension: PiggyBank,
  property: Home,
  mortgage: Building2,
  loan: Landmark,
  credit_card: CreditCard,
  crypto: Bitcoin,
};

const ACCENT_STYLES: Record<NodeMeta["accent"], { ring: string; icon: string; badge: string; glow: string }> = {
  amber: { ring: "ring-amber-400/40", icon: "text-amber-400", badge: "bg-amber-400/15 text-amber-300", glow: "shadow-[0_0_40px_-15px_rgba(251,191,36,0.6)]" },
  green: { ring: "ring-emerald-400/40", icon: "text-emerald-400", badge: "bg-emerald-400/15 text-emerald-300", glow: "shadow-[0_0_40px_-15px_rgba(52,211,153,0.6)]" },
  orange: { ring: "ring-orange-400/40", icon: "text-orange-400", badge: "bg-orange-400/15 text-orange-300", glow: "shadow-[0_0_40px_-15px_rgba(251,146,60,0.6)]" },
  violet: { ring: "ring-violet-400/40", icon: "text-violet-400", badge: "bg-violet-400/15 text-violet-300", glow: "shadow-[0_0_40px_-15px_rgba(167,139,250,0.6)]" },
  sky: { ring: "ring-sky-400/40", icon: "text-sky-400", badge: "bg-sky-400/15 text-sky-300", glow: "shadow-[0_0_40px_-15px_rgba(56,189,248,0.6)]" },
  rose: { ring: "ring-rose-400/40", icon: "text-rose-400", badge: "bg-rose-400/15 text-rose-300", glow: "shadow-[0_0_40px_-15px_rgba(251,113,133,0.6)]" },
  slate: { ring: "ring-slate-400/30", icon: "text-slate-300", badge: "bg-slate-400/15 text-slate-200", glow: "shadow-[0_0_40px_-15px_rgba(148,163,184,0.5)]" },
};

const NODE_WIDTH = 240;
const NODE_HEIGHT = 76;

function categorize(type: string) {
  return CATEGORIES.find((c) => c.types.includes(type));
}

function WealthNode({ data, selected }: NodeProps) {
  const meta = data as unknown as NodeMeta;
  const Icon = meta.icon;
  const styles = ACCENT_STYLES[meta.accent];
  const isRoot = meta.kind === "root";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`group relative flex items-center gap-3 rounded-2xl border border-white/5 bg-[#0f1520] px-4 py-3 ring-1 ${styles.ring} ${styles.glow} ${
        selected ? "ring-2 ring-primary/60" : ""
      }`}
      style={{ width: NODE_WIDTH, minHeight: NODE_HEIGHT }}
    >
      {!isRoot && <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-white/20" />}
      {meta.kind !== "account" && (
        <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-white/20" />
      )}

      <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ${styles.icon}`}>
        <Icon className="h-4 w-4" strokeWidth={2.25} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold leading-tight text-white">{meta.label}</p>
        {meta.sublabel && (
          <p className="mt-0.5 truncate text-[11px] text-white/50 tabular-nums">{meta.sublabel}</p>
        )}
      </div>

      {typeof meta.count === "number" && meta.count > 0 && (
        <span
          className={`absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${styles.badge}`}
        >
          {meta.count}
        </span>
      )}

      <GripVertical className="h-3.5 w-3.5 flex-shrink-0 text-white/20 transition-colors group-hover:text-white/40" />
    </motion.div>
  );
}

const nodeTypes = { wealth: WealthNode };

function layout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 90, marginx: 20, marginy: 20 });
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => {
    const p = g.node(n.id);
    return { ...n, position: { x: p.x - NODE_WIDTH / 2, y: p.y - NODE_HEIGHT / 2 } };
  });
}

export default function WealthMapPage() {
  const { data: accounts = [] } = useAccounts();
  const { data: profiles = [] } = useHouseholdProfiles();
  const adults = useMemo(() => profiles.filter((p) => p.role === "adult"), [profiles]);
  const updateAccount = useUpdateAccount();

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const totalWealth = accounts.reduce((s, a) => s + Number(a.current_value), 0);

    nodes.push({
      id: "root",
      type: "wealth",
      position: { x: 0, y: 0 },
      data: {
        kind: "root",
        label: "Household",
        sublabel: formatCurrency(totalWealth, true),
        count: accounts.length,
        icon: Users,
        accent: "green",
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
      const memberValue = memberAccounts.reduce((s, a) => s + Number(a.current_value), 0);
      const memberNodeId = `member:${m.id}`;

      nodes.push({
        id: memberNodeId,
        type: "wealth",
        position: { x: 0, y: 0 },
        data: {
          kind: "member",
          label: m.name,
          sublabel: formatCurrency(memberValue, true),
          count: memberAccounts.length,
          icon: User,
          accent: "amber",
          memberId: m.id,
        } satisfies NodeMeta as unknown as Record<string, unknown>,
      });
      edges.push({ id: `e:root-${memberNodeId}`, source: "root", target: memberNodeId, type: "smoothstep" });

      CATEGORIES.forEach((cat) => {
        const catAccounts = memberAccounts.filter((a) => cat.types.includes(a.account_type));
        if (catAccounts.length === 0) return;
        const catValue = catAccounts.reduce((s, a) => s + Number(a.current_value), 0);
        const catNodeId = `cat:${m.id}:${cat.key}`;

        nodes.push({
          id: catNodeId,
          type: "wealth",
          position: { x: 0, y: 0 },
          data: {
            kind: "category",
            label: cat.label,
            sublabel: formatCurrency(catValue, true),
            count: catAccounts.length,
            icon: cat.icon,
            accent: cat.accent,
          } satisfies NodeMeta as unknown as Record<string, unknown>,
        });
        edges.push({ id: `e:${memberNodeId}-${catNodeId}`, source: memberNodeId, target: catNodeId, type: "smoothstep" });

        catAccounts.forEach((a) => {
          const acctNodeId = `acct:${a.id}`;
          nodes.push({
            id: acctNodeId,
            type: "wealth",
            position: { x: 0, y: 0 },
            data: {
              kind: "account",
              label: a.name,
              sublabel: formatCurrency(Number(a.current_value), true),
              icon: ACCOUNT_ICON[a.account_type] ?? Wallet,
              accent: cat.accent,
              accountId: a.id,
              accountType: a.account_type,
              ownerName: a.owner_name,
              memberId: m.id,
            } satisfies NodeMeta as unknown as Record<string, unknown>,
          });
          edges.push({ id: `e:${catNodeId}-${acctNodeId}`, source: catNodeId, target: acctNodeId, type: "smoothstep" });
        });
      });
    });

    const laid = layout(nodes, edges);
    const styledEdges: Edge[] = edges.map((e) => ({
      ...e,
      animated: false,
      style: { stroke: "hsl(215 20% 30%)", strokeWidth: 1.25 },
    }));

    return { initialNodes: laid, initialEdges: styledEdges };
  }, [accounts, adults]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [draggingAccount, setDraggingAccount] = useState<Account | null>(null);

  // Re-hydrate when data changes
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

      // Detect drop target from underlying element
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
        // Snap back to layout position
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
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Wealth map</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Household → member → category → account. Drag an account onto a member to reassign ownership.
        </p>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-3xl border border-border/60 bg-[#0a0e17]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.2}
          maxZoom={1.5}
        >
          <Background color="hsl(215 20% 20%)" gap={24} size={1} />
          <MiniMap
            className="!bg-[#0f1520] !border-white/10"
            maskColor="rgba(10,14,23,0.85)"
            nodeColor="#1e293b"
            nodeStrokeColor="#334155"
          />
          <Controls className="!bg-[#0f1520] !border-white/10 [&>button]:!bg-transparent [&>button]:!border-white/10 [&>button]:!text-white/70 [&>button:hover]:!bg-white/5" />
        </ReactFlow>

        {draggingAccount && (
          <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-primary/90 px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg">
            Drop on a member to reassign {draggingAccount.name}
          </div>
        )}
      </div>
    </div>
  );
}
