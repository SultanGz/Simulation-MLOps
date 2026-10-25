import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useReactFlow,
  applyNodeChanges,
  MarkerType,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeChange,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  getStageDiagram,
  stageDiagrams,
  type ContainerNodeData,
  type StageDiagram,
} from "./containerData";
import { lifecycleStages } from "../lifecycle/lifecycleData";
import type { DiagramPlaybackStep } from "../simulation/simulation";
import { ContainerNode, type ContainerFlowNode } from "./ContainerNode";
import {
  ContainerDetailNode,
  type ContainerDetailFlowNode,
} from "./ContainerDetailNode";

type StageBoundaryStatus = "pending" | "active" | "done";

type StageBoundaryFlowNode = Node<
  { stageId: string; label: string; status: StageBoundaryStatus },
  "stageBoundary"
>;

function StageBoundaryNode({ data }: NodeProps<StageBoundaryFlowNode>) {
  return (
    <div className={`stage-boundary stage-boundary--${data.status}`}>
      <Handle
        id="t-left"
        type="target"
        position={Position.Left}
        className="context-handle"
      />
      <Handle
        id="t-right"
        type="target"
        position={Position.Right}
        className="context-handle"
      />
      <Handle
        id="t-top"
        type="target"
        position={Position.Top}
        className="context-handle"
      />
      <Handle
        id="t-bottom"
        type="target"
        position={Position.Bottom}
        className="context-handle"
      />
      <Handle
        id="s-left"
        type="source"
        position={Position.Left}
        className="context-handle"
      />
      <Handle
        id="s-right"
        type="source"
        position={Position.Right}
        className="context-handle"
      />
      <Handle
        id="s-top"
        type="source"
        position={Position.Top}
        className="context-handle"
      />
      <Handle
        id="s-bottom"
        type="source"
        position={Position.Bottom}
        className="context-handle"
      />
      <header className="stage-boundary__header">
        <span className="stage-boundary__label">{data.label}</span>
        <span className="stage-boundary__status">
          {data.status === "active"
            ? "Current stage"
            : data.status === "done"
              ? "Completed"
              : "Upcoming"}
        </span>
      </header>
    </div>
  );
}

const nodeTypes = {
  container: ContainerNode,
  containerDetail: ContainerDetailNode,
  stageBoundary: StageBoundaryNode,
};

const DETAIL_MAX_W = 480;
const DETAIL_H = 440;
const NARROW_BP = 600;
const NODE_W = 210;
const NODE_H = 104;
const BOUNDARY_PAD = 44;
const BOUNDARY_HEADER = 56;
const HANDOFF_GAP = 80;
const CLUSTER_W = 1780;
const CLUSTER_H = 1120;
const CLUSTER_COLS = 4;

interface Level2CanvasProps {
  stageId: string;
  selectedContainerId: string | null;
  showDetails?: boolean;
  onSelect: (id: string | null) => void;
  theme: "light" | "dark";
  overview?: boolean;
  activeOrder?: number;
  finished?: boolean;
  onStageSelect?: (id: string) => void;
  playbackStep?: DiagramPlaybackStep | null;
  completedPlaybackSteps?: DiagramPlaybackStep[];
  playbackRunning?: boolean;
}

interface PlacedNode {
  node: ContainerNodeData;
  x: number;
  y: number;
}

interface StageLayout {
  width: number;
  height: number;
  internals: PlacedNode[];
  outside: PlacedNode[];
}

function stageStatus(
  order: number,
  activeOrder: number,
  finished: boolean,
): StageBoundaryStatus {
  if (finished || order < activeOrder) return "done";
  if (order === activeOrder && activeOrder > 0) return "active";
  return "pending";
}

function layoutStage(diagram: StageDiagram): StageLayout {
  const internals = diagram.nodes.filter(
    (n) => n.kind !== "handoff" && n.kind !== "external",
  );
  const handoffs = diagram.nodes.filter((n) => n.kind === "handoff");
  const externals = diagram.nodes.filter((n) => n.kind === "external");
  const minX = Math.min(...internals.map((n) => n.x));
  const minY = Math.min(...internals.map((n) => n.y));
  const maxX = Math.max(...internals.map((n) => n.x));
  const maxY = Math.max(...internals.map((n) => n.y));
  const width = maxX - minX + NODE_W + BOUNDARY_PAD * 2;
  const height = maxY - minY + NODE_H + BOUNDARY_PAD * 2 + BOUNDARY_HEADER;
  const inner = internals.map((n) => ({
    node: n,
    x: n.x - minX + BOUNDARY_PAD,
    y: n.y - minY + BOUNDARY_HEADER + BOUNDARY_PAD,
  }));
  const outside: PlacedNode[] = [];
  handoffs
    .filter((n) => n.id.startsWith("from-stage"))
    .forEach((n, i) =>
      outside.push({
        node: n,
        x: BOUNDARY_PAD + i * (NODE_W + 30),
        y: -(NODE_H + HANDOFF_GAP),
      }),
    );
  handoffs
    .filter((n) => n.id.startsWith("to-stage"))
    .forEach((n, i) =>
      outside.push({
        node: n,
        x: width + HANDOFF_GAP,
        y: BOUNDARY_HEADER + BOUNDARY_PAD + i * (NODE_H + 30),
      }),
    );
  handoffs
    .filter((n) => n.id.startsWith("back-stage") || n.id.startsWith("fb-"))
    .forEach((n, i) =>
      outside.push({
        node: n,
        x: BOUNDARY_PAD + i * (NODE_W + 30),
        y: height + HANDOFF_GAP,
      }),
    );
  externals.forEach((n, i) =>
    outside.push({
      node: n,
      x: -(NODE_W + HANDOFF_GAP),
      y: BOUNDARY_HEADER + BOUNDARY_PAD + i * (NODE_H + 30),
    }),
  );
  return { width, height, internals: inner, outside };
}

function clusterOrigin(index: number): { x: number; y: number } {
  const row = Math.floor(index / CLUSTER_COLS);
  const col = index % CLUSTER_COLS;
  return {
    x: (row % 2 === 0 ? col : CLUSTER_COLS - 1 - col) * CLUSTER_W,
    y: row * CLUSTER_H,
  };
}

function handoffTargetStage(id: string): number | null {
  const forward = id.match(/^(?:to-stage|back-stage)-(\d+)$/);
  if (forward) return Number(forward[1]);
  const fb: Record<string, number> = {
    "fb-train": 4,
    "fb-data": 2,
    "fb-define": 1,
  };
  return fb[id] ?? null;
}

const ns = (stageId: string, id: string) => `${stageId}:${id}`;

const EMPTY_PLAYBACK_STEPS: DiagramPlaybackStep[] = [];

function Diagram({
  stageId,
  selectedContainerId,
  showDetails = true,
  onSelect,
  theme,
  overview = false,
  activeOrder = 0,
  finished = false,
  onStageSelect,
  playbackStep = null,
  completedPlaybackSteps = EMPTY_PLAYBACK_STEPS,
  playbackRunning = false,
}: Level2CanvasProps) {
  const { fitView } = useReactFlow();
  const diagram = getStageDiagram(stageId);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fitFrame = useRef(0);

  const [viewportW, setViewportW] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const detailW = Math.min(DETAIL_MAX_W, viewportW - 48);
  const narrow = viewportW < NARROW_BP;

  const frameRef = useRef<{ nodes: { id: string }[] | null; padding: number }>({
    nodes: null,
    padding: 0.18,
  });
  const scheduleFit = useCallback(
    (nodes: { id: string }[] | null, padding: number, duration: number) => {
      frameRef.current = { nodes, padding };
      cancelAnimationFrame(fitFrame.current);
      fitFrame.current = requestAnimationFrame(() => {
        void fitView({
          nodes: nodes ?? undefined,
          padding,
          maxZoom: 1,
          duration,
        });
      });
    },
    [fitView],
  );

  useEffect(() => {
    if (!canvasRef.current) return;
    const observer = new ResizeObserver(() => {
      const { nodes: targets, padding } = frameRef.current;
      cancelAnimationFrame(fitFrame.current);
      fitFrame.current = requestAnimationFrame(() => {
        void fitView({
          nodes: targets ?? undefined,
          padding,
          maxZoom: 1,
          duration: 0,
        });
      });
    });
    observer.observe(canvasRef.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(fitFrame.current);
    };
  }, [fitView]);

  const activeStepKey = playbackStep
    ? ns(playbackStep.stageId, playbackStep.nodeId)
    : null;
  const activePlaybackEdgeIds = useMemo(
    () => new Set(playbackStep?.edgeIds ?? []),
    [playbackStep],
  );
  const completedPlaybackNodeKeys = useMemo(
    () =>
      new Set(
        completedPlaybackSteps.map((step) => ns(step.stageId, step.nodeId)),
      ),
    [completedPlaybackSteps],
  );
  const completedPlaybackEdgeKeys = useMemo(() => {
    const keys = new Set<string>();
    completedPlaybackSteps.forEach((step) =>
      step.edgeIds.forEach((edgeId) => keys.add(ns(step.stageId, edgeId))),
    );
    return keys;
  }, [completedPlaybackSteps]);
  const animatePlaybackEdges =
    playbackRunning &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const generatedNodes: Node[] = useMemo(() => {
    const playbackClass = (nodeStageId: string, nodeId: string) =>
      activeStepKey === ns(nodeStageId, nodeId)
        ? "simulation-node--active"
        : completedPlaybackNodeKeys.has(ns(nodeStageId, nodeId))
          ? "simulation-node--done"
          : undefined;
    if (overview) {
      const out: Node[] = [];
      stageDiagrams.forEach((stageDiagram, index) => {
        const stage = lifecycleStages[index];
        const layout = layoutStage(stageDiagram);
        const origin = clusterOrigin(index);
        const boundaryId = ns(stageDiagram.stageId, "stage");
        out.push({
          id: boundaryId,
          type: "stageBoundary",
          position: origin,
          data: {
            stageId: stageDiagram.stageId,
            label: `Stage ${stage.order} · ${stage.name}`,
            status: stageStatus(stage.order, activeOrder, finished),
          },
          style: { width: layout.width, height: layout.height },
          draggable: false,
          selectable: false,
          ariaLabel: `Stage ${stage.order}: ${stage.name}`,
        } satisfies StageBoundaryFlowNode);
        layout.internals.forEach(({ node: n, x, y }) => {
          out.push({
            id: ns(stageDiagram.stageId, n.id),
            type: "container",
            parentId: boundaryId,
            position: { x, y },
            data: {
              name: n.name,
              responsibility: n.responsibility,
              kind: n.kind,
            },
            className: playbackClass(stageDiagram.stageId, n.id),
            draggable: false,
            ariaLabel: `${n.kind}: ${n.name}`,
          } satisfies ContainerFlowNode);
        });
        layout.outside.forEach(({ node: n, x, y }) => {
          out.push({
            id: ns(stageDiagram.stageId, n.id),
            type: "container",
            position: { x: origin.x + x, y: origin.y + y },
            data: {
              name: n.name,
              responsibility: n.responsibility,
              kind: n.kind,
            },
            className: playbackClass(stageDiagram.stageId, n.id),
            draggable: false,
            ariaLabel: `${n.kind}: ${n.name}`,
          } satisfies ContainerFlowNode);
        });
      });
      return out;
    }

    if (!diagram) return [];
    const stage = lifecycleStages.find((s) => s.id === diagram.stageId);
    const layout = layoutStage(diagram);
    const boundaryId = "stage-boundary";
    const boundary: StageBoundaryFlowNode = {
      id: boundaryId,
      type: "stageBoundary",
      position: { x: 0, y: 0 },
      data: {
        stageId: diagram.stageId,
        label: stage ? `Stage ${stage.order} · ${stage.name}` : diagram.stageId,
        status: stage
          ? stageStatus(stage.order, activeOrder, finished)
          : "pending",
      },
      style: { width: layout.width, height: layout.height },
      draggable: false,
      selectable: false,
      ariaLabel: stage
        ? `Stage ${stage.order}: ${stage.name}`
        : diagram.stageId,
    };
    const containers: ContainerFlowNode[] = [
      ...layout.internals.map(({ node: n, x, y }) => ({
        id: n.id,
        type: "container" as const,
        parentId: boundaryId,
        position: { x, y },
        data: { name: n.name, responsibility: n.responsibility, kind: n.kind },
        className: playbackClass(diagram.stageId, n.id),
        selected: selectedContainerId === n.id,
        draggable: false,
        ariaLabel: `${n.kind}: ${n.name}`,
      })),
      ...layout.outside.map(({ node: n, x, y }) => ({
        id: n.id,
        type: "container" as const,
        position: { x, y },
        data: { name: n.name, responsibility: n.responsibility, kind: n.kind },
        className: playbackClass(diagram.stageId, n.id),
        selected: selectedContainerId === n.id,
        draggable: false,
        ariaLabel: `${n.kind}: ${n.name}`,
      })),
    ];

    // One persistent detail window parked above the diagram grid.
    const details: ContainerDetailFlowNode[] = [];
    const sel = diagram.nodes.find((n) => n.id === selectedContainerId);
    if (showDetails && sel) {
      const placed = [...layout.internals, ...layout.outside];
      const minY = Math.min(...placed.map((p) => p.y), 0);
      const minX = Math.min(...placed.map((p) => p.x), 0);
      const maxX = Math.max(...placed.map((p) => p.x + NODE_W), layout.width);
      details.push({
        id: "container-detail",
        type: "containerDetail",
        position: {
          x: minX + (maxX - minX - detailW) / 2,
          y: minY - DETAIL_H - 70,
        },
        data: {
          title: sel.name,
          detail: sel.detail,
          onClose: () => onSelect(null),
        },
        style: { width: detailW },
        selectable: false,
        draggable: false,
        focusable: false,
        zIndex: 20,
      });
    }

    return [boundary, ...containers, ...details];
  }, [
    diagram,
    selectedContainerId,
    showDetails,
    detailW,
    onSelect,
    overview,
    activeOrder,
    finished,
    activeStepKey,
    completedPlaybackNodeKeys,
  ]);

  const [nodes, setNodes] = useState<Node[]>(generatedNodes);
  useEffect(() => {
    setNodes((previous) => {
      const byId = new Map(previous.map((node) => [node.id, node]));
      return generatedNodes.map((node) => ({
        ...node,
        measured: byId.get(node.id)?.measured ?? node.measured,
      }));
    });
  }, [generatedNodes]);

  const edges: Edge[] = useMemo(() => {
    const playbackEdge = (edgeStageId: string, edgeId: string) => {
      const isActive =
        playbackStep?.stageId === edgeStageId &&
        activePlaybackEdgeIds.has(edgeId);
      const isDone = completedPlaybackEdgeKeys.has(ns(edgeStageId, edgeId));
      const cls = isActive
        ? "simulation-edge--active"
        : isDone
          ? "simulation-edge--done"
          : undefined;
      return { cls, animated: isActive && animatePlaybackEdges };
    };
    const edgeClass = (
      base: string | undefined,
      playback: string | undefined,
    ) => [base, playback].filter(Boolean).join(" ") || undefined;
    if (overview) {
      const out: Edge[] = [];
      stageDiagrams.forEach((stageDiagram, index) => {
        stageDiagram.edges.forEach((e) => {
          const pb = playbackEdge(stageDiagram.stageId, e.id);
          out.push({
            id: ns(stageDiagram.stageId, e.id),
            source: ns(stageDiagram.stageId, e.source),
            target: ns(stageDiagram.stageId, e.target),
            sourceHandle: e.sourceHandle ?? "s-right",
            targetHandle: e.targetHandle ?? "t-left",
            type: "smoothstep",
            label: e.label,
            labelStyle: { fontSize: 10.5, fill: "var(--ink)" },
            labelBgStyle: { fill: "var(--paper)" },
            labelBgPadding: [5, 2] as [number, number],
            markerEnd: { type: MarkerType.ArrowClosed },
            animated: pb.animated,
            className: edgeClass(
              e.kind === "decision"
                ? "l2-edge--decision"
                : e.kind === "handoff"
                  ? "l2-edge--handoff"
                  : undefined,
              pb.cls,
            ),
          });
        });
        stageDiagram.nodes
          .filter((n) => n.kind === "handoff")
          .forEach((n) => {
            const targetOrder = handoffTargetStage(n.id);
            if (targetOrder === null || n.id.startsWith("from-stage")) return;
            const targetDiagram = stageDiagrams[targetOrder - 1];
            if (!targetDiagram) return;
            const inboundId = `from-stage-${index + 1}`;
            const hasInbound = targetDiagram.nodes.some(
              (t) => t.id === inboundId,
            );
            const feed = stageDiagram.edges.find((e) => e.target === n.id);
            const backward =
              n.id.startsWith("back-stage") || n.id.startsWith("fb-");
            const crossActive =
              !backward &&
              hasInbound &&
              playbackStep?.stageId === targetDiagram.stageId &&
              playbackStep.nodeId === inboundId;
            const crossDone =
              !backward &&
              hasInbound &&
              completedPlaybackNodeKeys.has(
                ns(targetDiagram.stageId, inboundId),
              );
            out.push({
              id: ns(stageDiagram.stageId, `x-${n.id}`),
              source: ns(stageDiagram.stageId, n.id),
              sourceHandle: backward ? "s-top" : "s-right",
              target: hasInbound
                ? ns(targetDiagram.stageId, inboundId)
                : ns(targetDiagram.stageId, "stage"),
              targetHandle: backward ? "t-bottom" : "t-left",
              type: "smoothstep",
              label: feed?.label ?? n.responsibility,
              labelStyle: { fontSize: 10.5, fill: "var(--ink)" },
              labelBgStyle: { fill: "var(--paper)" },
              labelBgPadding: [5, 2] as [number, number],
              markerEnd: { type: MarkerType.ArrowClosed },
              animated: crossActive && animatePlaybackEdges,
              className: edgeClass(
                backward ? "l2-edge--decision" : "l2-edge--handoff",
                crossActive
                  ? "simulation-edge--active"
                  : crossDone
                    ? "simulation-edge--done"
                    : undefined,
              ),
            });
          });
      });
      return out;
    }

    const flow: Edge[] = (diagram?.edges ?? []).map((e) => {
      const pb = diagram
        ? playbackEdge(diagram.stageId, e.id)
        : { cls: undefined, animated: false };
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? "s-right",
        targetHandle: e.targetHandle ?? "t-left",
        type: "smoothstep",
        label: e.label,
        labelStyle: { fontSize: 10.5, fill: "var(--ink)" },
        labelBgStyle: { fill: "var(--paper)" },
        labelBgPadding: [5, 2] as [number, number],
        markerEnd: { type: MarkerType.ArrowClosed },
        animated: pb.animated,
        className: edgeClass(
          e.kind === "decision"
            ? "l2-edge--decision"
            : e.kind === "handoff"
              ? "l2-edge--handoff"
              : undefined,
          pb.cls,
        ),
      };
    });

    if (
      showDetails &&
      diagram?.nodes.some((n) => n.id === selectedContainerId)
    ) {
      flow.push({
        id: "container-detail-edge",
        source: selectedContainerId as string,
        sourceHandle: "s-top",
        target: "container-detail",
        targetHandle: "t-bottom",
        type: "smoothstep",
        className: "canvas-edge--detail",
        focusable: false,
        selectable: false,
      });
    }

    return flow;
  }, [
    diagram,
    selectedContainerId,
    showDetails,
    overview,
    playbackStep?.stageId,
    activePlaybackEdgeIds,
    completedPlaybackEdgeKeys,
    completedPlaybackNodeKeys,
    playbackStep?.nodeId,
    animatePlaybackEdges,
  ]);

  // Re-frame the whole diagram whenever the stage or selection changes.
  useEffect(() => {
    if (overview) {
      if (playbackStep) {
        const nodeTarget = {
          id: ns(playbackStep.stageId, playbackStep.nodeId),
        };
        scheduleFit(
          narrow
            ? [nodeTarget]
            : [{ id: ns(playbackStep.stageId, "stage") }, nodeTarget],
          0.22,
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? 0
            : 450,
        );
      } else {
        scheduleFit(
          null,
          0.06,
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? 0
            : 450,
        );
      }
      return;
    }
    const selected = diagram?.nodes.find(
      (node) => node.id === selectedContainerId,
    );
    const targets = selected
      ? showDetails && narrow
        ? [{ id: "container-detail" }]
        : showDetails
          ? [{ id: "container-detail" }, { id: selected.id }]
          : [{ id: selected.id }]
      : diagram
        ? [
            { id: "stage-boundary" },
            ...diagram.nodes.map((n) => ({ id: n.id })),
          ]
        : null;
    if (targets?.length || targets === null) {
      scheduleFit(
        targets,
        selectedContainerId ? (showDetails && narrow ? 0.06 : 0.3) : 0.18,
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 450,
      );
    }
  }, [
    stageId,
    selectedContainerId,
    diagram,
    showDetails,
    narrow,
    scheduleFit,
    overview,
    playbackStep?.stageId,
    playbackStep?.nodeId,
  ]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((previous) => applyNodeChanges(changes, previous));
      if (
        !changes.some(
          (change) => change.type === "dimensions" && change.dimensions,
        )
      )
        return;
      cancelAnimationFrame(fitFrame.current);
      fitFrame.current = requestAnimationFrame(() => {
        const { nodes: targets, padding } = frameRef.current;
        void fitView({
          nodes: targets ?? undefined,
          padding,
          maxZoom: 1,
          duration: 0,
        });
      });
    },
    [fitView],
  );

  const resetView = useCallback(() => {
    frameRef.current = { nodes: null, padding: overview ? 0.06 : 0.18 };
    void fitView({
      padding: overview ? 0.06 : 0.18,
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 250,
    });
  }, [fitView, overview]);

  const stageFromNodeId = useCallback((id: string): string | null => {
    if (!id.includes(":")) return null;
    const sid = id.split(":")[0];
    return stageDiagrams.some((d) => d.stageId === sid) ? sid : null;
  }, []);

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      if (overview) {
        const sid =
          node.type === "stageBoundary"
            ? ((node.data as { stageId?: string }).stageId ?? null)
            : stageFromNodeId(node.id);
        if (sid) onStageSelect?.(sid);
        return;
      }
      if (node.type === "container") onSelect(node.id);
    },
    [overview, onSelect, onStageSelect, stageFromNodeId],
  );
  const onPaneClick = useCallback(() => onSelect(null), [onSelect]);

  const onCanvasKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key !== "Enter") return;
      const target = event.target as HTMLElement;
      if (
        target.closest("input, textarea, select, button, a, [contenteditable]")
      )
        return;
      const nodeEl = target.closest(".react-flow__node[data-id]");
      const id = nodeEl?.getAttribute("data-id");
      if (!id) return;
      if (overview) {
        const sid = stageFromNodeId(id);
        if (sid) onStageSelect?.(sid);
        return;
      }
      if (diagram?.nodes.some((n) => n.id === id)) onSelect(id);
    },
    [diagram, onSelect, overview, onStageSelect, stageFromNodeId],
  );

  return (
    <div
      className="workspace-canvas"
      ref={canvasRef}
      onKeyDown={onCanvasKeyDown}
    >
      <ReactFlow
        colorMode={theme}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: overview ? 0.06 : 0.18 }}
        minZoom={overview ? 0.04 : 0.2}
        maxZoom={1.6}
        nodesFocusable
        elementsSelectable
        autoPanOnNodeFocus
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        deleteKeyCode={null}
        panOnScroll
        zoomOnPinch
      >
        <Background gap={28} />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>
      <div className="l2-legend" aria-hidden="true">
        <span>
          <i className="l2-legend__swatch l2-legend__swatch--service" /> Service
        </span>
        <span>
          <i className="l2-legend__swatch l2-legend__swatch--store" /> Data
          store
        </span>
        <span>
          <i className="l2-legend__swatch l2-legend__swatch--external" />{" "}
          External
        </span>
        <span>
          <i className="l2-legend__swatch l2-legend__swatch--handoff" /> Handoff
        </span>
      </div>
      <button
        type="button"
        className="btn btn--ghost canvas-reset-view"
        onClick={resetView}
      >
        Reset view
      </button>
    </div>
  );
}

export function Level2Canvas(props: Level2CanvasProps) {
  return (
    <ReactFlowProvider>
      <Diagram {...props} />
    </ReactFlowProvider>
  );
}
