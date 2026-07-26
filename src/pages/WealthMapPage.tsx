/**
 * Wealth Map — clean hierarchical view of household wealth.
 * Household → Member (or Region) → Bucket → Account.
 *
 * Design goals: family-tree readability with floating avatar badges,
 * progressive disclosure (buckets collapsed by default, click to expand
 * accounts), and a slide-in detail panel on selection.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  Panel,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import { motion, AnimatePresence } from "framer-motion";
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
  Gem,
  Car,
  Plus,
  Minus,
  Maximize2,
  RotateCcw,
  UsersRound,
  Globe2,
  ChevronRight,
  X,
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
import { accountRegion, REGION_META, type Region } from "@/lib/geography";
import { formatCurrency } from "@/lib/format";
import { toast } from "@/hooks/use-toast";

/* ─── Buckets ─── */
type Bucket = "guaranteed" | "growth" | "safety" | "property";

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
}[] = [
  { key: "guaranteed", label: "Guaranteed", icon: Shield, types: ["db_pension", "workplace_pension", "sipp"] },
  { key: "growth", label: "Growth", icon: TrendingUp, types: ["stocks_and_shares_isa", "cash_isa", "gia", "crypto", "employer_share_scheme"] },
  { key: "safety", label: "Safety Net", icon: Landmark, types: ["current_account", "savings"] },
  { key: "property", label: "Property & Debt", icon: HomeIcon, types: ["property", "mortgage", "loan", "credit_card"] },
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
  amount: string;
  amountSuffix?: string;
  count?: number;
  color: string;
  icon: LucideIcon;
  accountId?: string;
  memberId?: string;
  bucket?: Bucket;
  isNegative?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

const NODE_WIDTH = 260;
const NODE_HEIGHT = 88;

function WealthNode({ data, selected }: NodeProps) {
  const meta = data as unknown as NodeMeta;
  const Icon = meta.icon;
  const isRoot = meta.kind === "root";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group relative"
      style={{ width: NODE_WIDTH, minHeight: NODE_HEIGHT }}
    >
      {!isRoot && <Handle type="target" position={Position.Top} className="!h-1.5 !w-1.5 !border-0 !bg-border" />}
      {meta.kind !== "account" && (
        <Handle type="source" position={Position.Bottom} className="!h-1.5 !w-1.5 !border-0 !bg-border" />
      )}

      {/* Floating badge — like the family-tree reference */}
      <div
        className="absolute -top-3 left-4 z-10 flex h-9 w-9 items-center justify-center rounded-full ring-4 ring-background"
        style={{ backgroundColor: meta.color, color: "#fff" }}
      >
        <Icon className="h-4 w-4" strokeWidth={2.4} />
      </div>

      {/* Count pill */}
      {typeof meta.count === "number" && meta.count > 0 && (
        <span
          className="absolute -top-2 right-3 z-10 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ring-2 ring-background"
          style={{ backgroundColor: `${meta.color}`, color: "#fff" }}
        >
          {meta.count}
        </span>
      )}

      {/* Card */}
      <div
        className="relative flex h-full flex-col justify-center rounded-2xl border bg-card px-4 pt-5 pb-3 shadow-sm transition-shadow"
        style={{
          borderColor: selected ? "hsl(var(--ring))" : "hsl(var(--border) / 0.7)",
          boxShadow: selected
            ? `0 0 0 3px hsl(var(--ring) / 0.15), 0 8px 24px -12px ${meta.color}55`
            : `0 1px 2px hsl(var(--foreground) / 0.04)`,
        }}
      >
        <p className="truncate pl-11 text-[13px] font-semibold leading-tight text-foreground">
          {meta.label}
        </p>
        <p
          className={`mt-1 truncate pl-11 text-[15px] font-semibold tabular-nums leading-tight ${
            meta.isNegative ? "text-destructive" : "text-foreground/90"
          }`}
        >
          {meta.amount}
          {meta.amountSuffix && (
            <span className="ml-1 text-[11px] font-medium text-muted-foreground">{meta.amountSuffix}</span>
          )}
        </p>

        {meta.expandable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              meta.onToggle?.();
            }}
            className="absolute bottom-2 right-2 flex h-6 items-center gap-0.5 rounded-full border border-border/60 bg-background/80 px-2 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={meta.expanded ? "Collapse accounts" : "Expand accounts"}
          >
            <span>{meta.expanded ? "Hide" : "Show"}</span>
            <ChevronRight
              className={`h-3 w-3 transition-transform ${meta.expanded ? "rotate-90" : ""}`}
              strokeWidth={2.5}
            />
          </button>
        )}
      </div>
    </motion.div>
  );
}

const nodeTypes = { wealth: WealthNode };

function layout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 32, ranksep: 80, marginx: 24, marginy: 32, ranker: "tight-tree" });
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => {
    const p = g.node(n.id);
    return { ...n, position: { x: p.x - NODE_WIDTH / 2, y: p.y - NODE_HEIGHT / 2 } };
  });
}

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

export default function WealthMapPage() {
  const { data: accounts = [] } = useAccounts();
  const { data: dbPensions = [] } = useDBPensions();
  const { data: profiles = [] } = useHouseholdProfiles();
  const adults = useMemo(() => profiles.filter((p) => p.role === "adult"), [profiles]);
  const updateAccount = useUpdateAccount();

  const [groupJoint, setGroupJoint] = useState(true);
  const [groupBy, setGroupBy] = useState<"owner" | "region">("owner");
  const [expandedBuckets, setExpandedBuckets] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggleBucket = useCallback((id: string) => {
    setExpandedBuckets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

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

  const { initialNodes, initialEdges, netWorth, totalAccounts } = useMemo(() => {
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
        amount: formatCurrency(nw, true),
        amountSuffix: "net worth",
        count: accounts.length,
        icon: Users,
        color: "hsl(217 91% 60%)",
      } satisfies NodeMeta as unknown as Record<string, unknown>,
    });

    type Group = {
      id: string;
      name: string;
      color: string;
      icon: LucideIcon;
      isJoint?: boolean;
      filter: (a: Account) => boolean;
    };

    let groupList: Group[] = [];

    if (groupBy === "region") {
      const regionsPresent = new Set<Region>();
      accounts.forEach((a) => regionsPresent.add(accountRegion(a)));
      groupList = Array.from(regionsPresent).map((r) => ({
        id: `region:${r}`,
        name: `${REGION_META[r].flag} ${REGION_META[r].label}`,
        color: REGION_META[r].color,
        icon: Globe2,
        filter: (a: Account) => accountRegion(a) === r,
      }));
    } else {
      const memberList: { id: string; name: string; isJoint?: boolean }[] =
        adults.length > 0
          ? adults.map((a) => ({ id: a.id, name: a.name }))
          : [{ id: "unassigned", name: "Unassigned" }];

      if (groupJoint && adults.length > 1) {
        memberList.push({ id: "joint", name: "Joint", isJoint: true });
      }

      groupList = memberList.map((m) => ({
        id: m.id,
        name: m.name,
        color: m.isJoint ? "#4F8CFF" : "hsl(217 91% 60%)",
        icon: m.isJoint ? UsersRound : User,
        isJoint: m.isJoint,
        filter: (a: Account) => {
          const owners = splitOwnerNames(a.owner_name);
          if (m.id === "unassigned") return owners.length === 0;
          if (m.isJoint) return owners.length > 1;
          if (groupJoint && owners.length > 1 && adults.length > 1) return false;
          return owners.includes(m.name.toLowerCase());
        },
      }));
    }

    groupList.forEach((g) => {
      const memberAccounts = accounts.filter(g.filter);
      if (memberAccounts.length === 0 && g.id !== "unassigned") return;

      const memberNet = memberAccounts.reduce((s, a) => s + Number(a.current_value), 0);
      const memberNodeId = `member:${g.id}`;

      nodes.push({
        id: memberNodeId,
        type: "wealth",
        position: { x: 0, y: 0 },
        data: {
          kind: "member",
          label: g.name,
          amount: formatCurrency(memberNet, true),
          amountSuffix: "net",
          count: memberAccounts.length,
          icon: g.icon,
          color: g.color,
          memberId: g.id,
          isNegative: memberNet < 0,
        } satisfies NodeMeta as unknown as Record<string, unknown>,
      });
      edges.push({ id: `e:root-${memberNodeId}`, source: "root", target: memberNodeId });

      BUCKETS.forEach((bucket) => {
        const bucketAccounts = memberAccounts.filter((a) => toBucket(a.account_type) === bucket.key);
        if (bucketAccounts.length === 0) return;

        const bucketTotal = bucketAccounts.reduce(
          (s, a) => s + accountBucketContribution(a, bucket.key, dbProjections[a.id]?.projected),
          0,
        );
        const bucketNodeId = `bucket:${g.id}:${bucket.key}`;
        const isExpanded = expandedBuckets.has(bucketNodeId);

        nodes.push({
          id: bucketNodeId,
          type: "wealth",
          position: { x: 0, y: 0 },
          data: {
            kind: "bucket",
            label: bucket.label,
            amount: formatCurrency(bucketTotal, true),
            amountSuffix: bucket.key === "guaranteed" ? "/yr" : undefined,
            count: bucketAccounts.length,
            icon: bucket.icon,
            color: BUCKET_COLOR[bucket.key],
            bucket: bucket.key,
            isNegative: bucketTotal < 0,
            expandable: true,
            expanded: isExpanded,
            onToggle: () => toggleBucket(bucketNodeId),
          } satisfies NodeMeta as unknown as Record<string, unknown>,
        });
        edges.push({
          id: `e:${memberNodeId}-${bucketNodeId}`,
          source: memberNodeId,
          target: bucketNodeId,
        });

        if (!isExpanded) return;

        bucketAccounts.forEach((a) => {
          const acctNodeId = `acct:${g.id}:${a.id}`;
          const displayVal = accountDisplayValue(a, dbProjections[a.id]?.projected);
          const suffix = a.account_type === "db_pension" ? "/yr" : undefined;

          nodes.push({
            id: acctNodeId,
            type: "wealth",
            position: { x: 0, y: 0 },
            data: {
              kind: "account",
              label: a.name,
              amount: formatCurrency(displayVal, true),
              amountSuffix: suffix,
              icon: ACCOUNT_ICON[a.account_type] ?? Wallet,
              color: BUCKET_COLOR[bucket.key],
              accountId: a.id,
              memberId: g.id,
              bucket: bucket.key,
              isNegative: displayVal < 0,
            } satisfies NodeMeta as unknown as Record<string, unknown>,
          });
          edges.push({
            id: `e:${bucketNodeId}-${acctNodeId}`,
            source: bucketNodeId,
            target: acctNodeId,
          });
        });
      });
    });

    const laid = layout(nodes, edges);
    const styledEdges: Edge[] = edges.map((e) => ({
      ...e,
      type: "smoothstep",
      animated: false,
      style: { stroke: "hsl(var(--border))", strokeWidth: 1.5 },
    }));

    return { initialNodes: laid, initialEdges: styledEdges, netWorth: nw, totalAccounts: accounts.length };
  }, [accounts, adults, dbProjections, groupJoint, groupBy, expandedBuckets, toggleBucket]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [draggingAccount, setDraggingAccount] = useState<Account | null>(null);
  const flowRef = useRef<ReactFlowInstance | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const fitToView = useCallback((duration = 200) => {
    flowRef.current?.fitView({ padding: 0.15, duration, maxZoom: 1 });
  }, []);

  const onInit = useCallback(
    (instance: ReactFlowInstance) => {
      flowRef.current = instance;
      requestAnimationFrame(() => fitToView(0));
    },
    [fitToView],
  );

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    const t = setTimeout(() => fitToView(250), 60);
    return () => clearTimeout(t);
  }, [initialNodes, initialEdges, setNodes, setEdges, fitToView]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => fitToView(0));
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [fitToView]);

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

  const expandAll = () => {
    const ids = new Set<string>();
    initialNodes.forEach((n) => {
      const m = n.data as unknown as NodeMeta;
      if (m.kind === "bucket") ids.add(n.id);
    });
    setExpandedBuckets(ids);
  };
  const collapseAll = () => setExpandedBuckets(new Set());

  const selectedNode = selectedId ? nodes.find((n) => n.id === selectedId) : null;
  const selectedMeta = selectedNode ? (selectedNode.data as unknown as NodeMeta) : null;
  const selectedAccount =
    selectedMeta?.kind === "account" && selectedMeta.accountId
      ? accounts.find((a) => a.id === selectedMeta.accountId)
      : null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Wealth map</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalAccounts} accounts · {formatCurrency(netWorth, true)} net worth ·{" "}
            {groupBy === "region" ? "grouped by geography" : "grouped by owner"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-full border border-border/60 bg-card p-0.5 text-[12px]">
            {([
              { key: "owner", label: "Owner", icon: User },
              { key: "region", label: "Geography", icon: Globe2 },
            ] as const).map((opt) => {
              const Icon = opt.icon;
              const active = groupBy === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setGroupBy(opt.key)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-pressed={active}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                  <span className="font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {groupBy === "owner" && adults.length > 1 && (
            <button
              type="button"
              onClick={() => setGroupJoint((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
                groupJoint
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/60 bg-card text-muted-foreground hover:bg-secondary"
              }`}
              aria-pressed={groupJoint}
              title="Group joint assets under a single Joint node"
            >
              <UsersRound className="h-3.5 w-3.5" strokeWidth={2.25} />
              <span className="font-medium">Joint</span>
            </button>
          )}

          <div className="flex items-center gap-0.5 rounded-full border border-border/60 bg-card p-0.5 text-[12px]">
            <button
              type="button"
              onClick={expandAll}
              className="rounded-full px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Expand all
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="rounded-full px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Collapse
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div ref={wrapperRef} className="card-surface relative flex-1 overflow-hidden !p-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={(_e, n) => setSelectedId(n.id)}
          onPaneClick={() => setSelectedId(null)}
          onInit={onInit}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.3}
          maxZoom={2}
          panOnScroll
          panOnDrag
          zoomOnScroll
          zoomOnPinch
          zoomOnDoubleClick={false}
          nodesDraggable
          selectionOnDrag={false}
          defaultEdgeOptions={{ type: "smoothstep" }}
        >
          <Background color="hsl(var(--border))" gap={28} size={1} />

          {/* Legend — top-left, subtle. Compact (dots only) on mobile */}
          <Panel position="top-left" className="!m-3 sm:!m-4">
            <div className="flex flex-wrap items-center gap-1 rounded-full border border-border/60 bg-card/95 px-2 py-1.5 shadow-sm backdrop-blur sm:gap-1.5">
              {BUCKETS.map((b) => (
                <span
                  key={b.key}
                  className="flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-[11px] text-foreground/80 sm:px-2"
                  title={b.label}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: BUCKET_COLOR[b.key] }}
                  />
                  <span className="hidden sm:inline">{b.label}</span>
                </span>
              ))}
            </div>
          </Panel>

          {/* Overview + zoom controls — bottom-right */}
          <Panel position="bottom-right" className="!m-3 !mb-4 sm:!m-4 sm:!mb-6">
            <div className="flex flex-col items-end gap-2">
              {/* MiniMap hidden on mobile — cramped and low-value at that size */}
              <div className="hidden overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-lg backdrop-blur sm:block">
                <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Overview
                  </span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">{nodes.length} nodes</span>
                </div>
                <MiniMap
                  className="!m-0 !bg-transparent"
                  style={{ width: 200, height: 130 }}
                  maskColor="hsl(var(--background) / 0.75)"
                  nodeColor={(n) => {
                    const c = (n.data as unknown as NodeMeta | undefined)?.color;
                    return c && c.startsWith("#") ? c : "hsl(var(--primary))";
                  }}
                  nodeStrokeColor="hsl(var(--border))"
                  nodeBorderRadius={4}
                  pannable
                  zoomable
                />
              </div>

              <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card/95 p-1 shadow-lg backdrop-blur">
                <button
                  type="button"
                  onClick={() => flowRef.current?.zoomOut({ duration: 200 })}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label="Zoom out"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => fitToView(250)}
                  className="flex h-7 items-center gap-1 rounded-full px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Fit</span>
                </button>
                <button
                  type="button"
                  onClick={() => flowRef.current?.zoomIn({ duration: 200 })}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label="Zoom in"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <div className="mx-1 h-4 w-px bg-border/60" />
                <button
                  type="button"
                  onClick={() => {
                    setExpandedBuckets(new Set());
                    setTimeout(() => fitToView(250), 40);
                  }}
                  className="flex h-7 items-center gap-1 rounded-full px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </Panel>
        </ReactFlow>

        {draggingAccount && (
          <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg">
            Drop on a member to reassign {draggingAccount.name}
          </div>
        )}

        {/* Slide-in detail panel */}
        <AnimatePresence>
          {selectedMeta && (
            <motion.aside
              key={selectedId}
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 24, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-x-3 top-3 z-20 max-h-[calc(100%-1.5rem)] overflow-y-auto rounded-2xl border border-border/60 bg-card/95 shadow-xl backdrop-blur sm:inset-x-auto sm:right-4 sm:top-4 sm:w-[280px]"
            >
              <div className="flex items-start justify-between gap-2 px-4 pt-4">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: selectedMeta.color }}
                  >
                    <selectedMeta.icon className="h-4 w-4" strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {selectedMeta.kind === "root"
                        ? "Household"
                        : selectedMeta.kind === "member"
                          ? "Member"
                          : selectedMeta.kind === "bucket"
                            ? "Bucket"
                            : "Account"}
                    </p>
                    <p className="truncate text-sm font-semibold text-foreground">{selectedMeta.label}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label="Close details"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-3 space-y-2 px-4 pb-4">
                <div className="rounded-xl bg-secondary/50 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {selectedMeta.kind === "account" && selectedAccount?.account_type === "db_pension"
                      ? "Projected income"
                      : selectedMeta.kind === "bucket" && selectedMeta.bucket === "guaranteed"
                        ? "Estimated income"
                        : "Value"}
                  </p>
                  <p
                    className={`mt-0.5 text-lg font-semibold tabular-nums ${
                      selectedMeta.isNegative ? "text-destructive" : "text-foreground"
                    }`}
                  >
                    {selectedMeta.amount}
                    {selectedMeta.amountSuffix && (
                      <span className="ml-1 text-[11px] font-medium text-muted-foreground">
                        {selectedMeta.amountSuffix}
                      </span>
                    )}
                  </p>
                </div>

                {typeof selectedMeta.count === "number" && selectedMeta.count > 0 && (
                  <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2 text-[12px]">
                    <span className="text-muted-foreground">Accounts</span>
                    <span className="font-semibold text-foreground tabular-nums">{selectedMeta.count}</span>
                  </div>
                )}

                {selectedAccount && (
                  <>
                    <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2 text-[12px]">
                      <span className="text-muted-foreground">Owner</span>
                      <span className="truncate font-medium text-foreground">
                        {selectedAccount.owner_name || "Unassigned"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2 text-[12px]">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium text-foreground">
                        {selectedAccount.account_type.replace(/_/g, " ")}
                      </span>
                    </div>
                  </>
                )}

                {selectedMeta.kind === "bucket" && (
                  <button
                    type="button"
                    onClick={() => selectedId && toggleBucket(selectedId)}
                    className="mt-1 flex w-full items-center justify-center gap-1 rounded-xl bg-primary/10 px-3 py-2 text-[12px] font-semibold text-primary transition-colors hover:bg-primary/15"
                  >
                    {selectedMeta.expanded ? "Hide accounts" : "Show accounts"}
                    <ChevronRight
                      className={`h-3.5 w-3.5 transition-transform ${selectedMeta.expanded ? "rotate-90" : ""}`}
                      strokeWidth={2.5}
                    />
                  </button>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
