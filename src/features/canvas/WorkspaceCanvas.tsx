import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useReactFlow,
  applyNodeChanges,
  MarkerType,
  type Node,
  type Edge,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { lifecycleStages } from "../lifecycle/lifecycleData";
import { StageNode, type StageFlowNode } from "./StageNode";
import { StageDetailNode, type StageDetailFlowNode } from "./StageDetailNode";
import { PreflightPanelNode } from "../preflight/PreflightPanelNode";

const nodeTypes = {
  lifecycleStage: StageNode,
  stageDetail: StageDetailNode,
  preflightPanel: PreflightPanelNode,
};

/* ---------- Precise 4x2 serpentine layout ---------- */

const STAGE_W = 190;
const STAGE_STEP = 250; // node width + 60px gap
const ROW_1_Y = 120;
const ROW_2_Y = 520;
const GRID_X = 40;

const DETAIL_MAX_W = 480;
const DETAIL_H = 440;
const DETAIL_GAP_Y = 60;
const NARROW_BP = 600;

/** Stage order → grid position (1-4 left→right, 5-8 right→left). */
function stagePosition(order: number): { x: number; y: number } {
  if (order <= 4) return { x: GRID_X + (order - 1) * STAGE_STEP, y: ROW_1_Y };
  return { x: GRID_X + (8 - order) * STAGE_STEP, y: ROW_2_Y };
}

/**
 * The detail window parks in the free lane: above row 1, below row 2 —
 * so it can never cover a stage node or a connector edge.
 */
function detailPosition(
  order: number,
  width: number,
): { x: number; y: number } {
  const p = stagePosition(order);
  const centered = p.x + STAGE_W / 2 - width / 2;
  const x = Math.max(
    GRID_X,
    Math.min(centered, GRID_X + 3 * STAGE_STEP + STAGE_W - width),
  );
  const y =
    order <= 4 ? ROW_1_Y - DETAIL_H - DETAIL_GAP_Y : ROW_2_Y + DETAIL_GAP_Y;
  return { x, y };
}

/* ---------- Component ---------- */

interface WorkspaceCanvasProps {
  selectedId: string | null;
  /** Stage order the simulation is on (0 = idle). */
  activeOrder: number;
  /** True once the simulation has run to the final stage. */
  finished: boolean;
  /** Optional scene panel node rendered during preflight. */
  preflightNode?: Node;
  /** Node id the camera should frame (preflight scenes); null = stage logic. */
  focusId?: string | null;
  /** Mount the lifecycle nodes only while the simulation scene is active. */
  showLifecycle: boolean;
  playbackRunning?: boolean;
  showDetails?: boolean;
  onSelect: (id: string | null) => void;
  onExploreStage?: (id: string) => void;
  theme: "light" | "dark";
}

function Canvas({
  selectedId,
  activeOrder,
  finished,
  preflightNode,
  focusId,
  showLifecycle,
  playbackRunning = false,
  showDetails = false,
  onSelect,
  onExploreStage,
  theme,
}: WorkspaceCanvasProps) {
  const { fitView } = useReactFlow();
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
    padding: 0.15,
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

  const generatedNodes: Node[] = useMemo(() => {
    const sceneNodes: Node[] = preflightNode ? [preflightNode] : [];
    if (!showLifecycle) return sceneNodes;

    const stages: StageFlowNode[] = lifecycleStages.map((stage) => {
      const state =
        stage.order < activeOrder || (finished && stage.order === 8)
          ? "completed"
          : stage.order === activeOrder && activeOrder > 0
            ? "current"
            : "upcoming";
      return {
        id: stage.id,
        type: "lifecycleStage",
        position: stagePosition(stage.order),
        data: { stage, state, selected: selectedId === stage.id },
        selected: selectedId === stage.id,
        draggable: false,
        ariaLabel: `Stage ${stage.order}: ${stage.name}`,
      };
    });

    // One persistent detail window (stable id → smooth move/content swap)
    // attached to whichever stage is selected.
    const detailNodes: StageDetailFlowNode[] = [];
    const selStage = lifecycleStages.find((s) => s.id === selectedId);
    if (showDetails && selStage) {
      const below = selStage.order > 4; // row-2 stages expand below the row
      detailNodes.push({
        id: "stage-detail",
        type: "stageDetail",
        position: detailPosition(selStage.order, detailW),
        data: {
          stage: selStage,
          below,
          onClose: () => onSelect(null),
          onExplore: onExploreStage
            ? () => onExploreStage(selStage.id)
            : undefined,
        },
        style: { width: detailW },
        selectable: false,
        draggable: false,
        focusable: false,
        zIndex: 20,
      });
    }

    return [...sceneNodes, ...stages, ...detailNodes];
  }, [
    selectedId,
    activeOrder,
    finished,
    preflightNode,
    showLifecycle,
    showDetails,
    detailW,
    onSelect,
    onExploreStage,
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
    if (!showLifecycle) return [];
    // Serpentine chain: row 1 left→right, down at 4→5, row 2 right→left.
    const chain: Edge[] = lifecycleStages.slice(1).map((stage) => {
      const prev = lifecycleStages[stage.order - 2];
      const done = stage.order <= activeOrder;
      const isActive = stage.order === activeOrder;
      const isTurn = stage.order === 5;
      const backwards = stage.order > 5;
      return {
        id: `chain-${stage.order}`,
        source: prev.id,
        target: stage.id,
        sourceHandle: isTurn ? "s-bottom" : backwards ? "s-left" : "s-right",
        targetHandle: isTurn ? "t-top" : backwards ? "t-right" : "t-left",
        type: "smoothstep",
        label: isActive ? prev.outputs[0]?.name : undefined,
        labelStyle: isActive
          ? { fontSize: 10, fill: "var(--muted)" }
          : undefined,
        labelBgStyle: isActive ? { fill: "var(--wash)" } : undefined,
        labelBgPadding: isActive ? ([4, 2] as [number, number]) : undefined,
        animated:
          isActive &&
          playbackRunning &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        className: done
          ? isActive
            ? "canvas-edge--done simulation-edge--active"
            : "canvas-edge--done"
          : isActive
            ? "simulation-edge--active"
            : undefined,
        markerEnd: { type: MarkerType.ArrowClosed },
        focusable: false,
      };
    });

    // Feedback loop: monitoring (8) returns into stage 1 to start a new cycle.
    const loop: Edge = {
      id: "loop-8-1",
      source: "monitor-respond",
      sourceHandle: "s-top",
      target: "define-problem",
      targetHandle: "t-bottom",
      type: "smoothstep",
      label: "feedback",
      className: `canvas-edge--loop${finished ? " canvas-edge--loop-live" : ""}`,
      labelStyle: { fontSize: 10, fill: "var(--muted)" },
      labelBgStyle: { fill: "var(--wash)" },
      labelBgPadding: [4, 2] as [number, number],
      markerEnd: { type: MarkerType.ArrowClosed },
      focusable: false,
    };

    // Connector from the selected stage to its attached detail window.
    const detailEdges: Edge[] = [];
    const selStage = lifecycleStages.find((s) => s.id === selectedId);
    if (showDetails && selStage) {
      const below = selStage.order > 4;
      detailEdges.push({
        id: "detail-edge",
        source: selStage.id,
        sourceHandle: below ? "s-bottom" : "s-top",
        target: "stage-detail",
        targetHandle: below ? "t-top" : "t-bottom",
        type: "smoothstep",
        className: "canvas-edge--detail",
        focusable: false,
        selectable: false,
      });
    }

    return [...chain, loop, ...detailEdges];
  }, [
    selectedId,
    activeOrder,
    finished,
    showLifecycle,
    showDetails,
    playbackRunning,
  ]);

  /* ----- camera ----- */

  // On mount: composed overview of the whole lifecycle.
  // After that, the camera frames the selected stage together with its
  // detail window so the card can never leave the viewport.
  const firstRender = useRef(true);
  const reducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    // Preflight scenes take camera priority.
    if (focusId) {
      scheduleFit(
        [{ id: focusId }],
        0.06,
        firstRender.current || reducedMotion() ? 0 : 500,
      );
      firstRender.current = false;
      return;
    }
    const selectedStage =
      showLifecycle && selectedId
        ? lifecycleStages.find((stage) => stage.id === selectedId)
        : undefined;
    if (firstRender.current && !(showDetails && selectedStage)) {
      firstRender.current = false;
      scheduleFit(null, 0.15, 0);
      return;
    }
    firstRender.current = false;
    if (selectedStage) {
      const targets =
        showDetails && narrow
          ? [{ id: "stage-detail" }]
          : showDetails
            ? [{ id: selectedStage.id }, { id: "stage-detail" }]
            : [{ id: selectedStage.id }];
      scheduleFit(
        targets,
        showDetails && narrow ? 0.06 : 0.25,
        reducedMotion() ? 0 : 450,
      );
    } else {
      scheduleFit(null, 0.15, reducedMotion() ? 0 : 400);
    }
  }, [selectedId, focusId, showDetails, showLifecycle, narrow, scheduleFit]);

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
    frameRef.current = { nodes: null, padding: 0.15 };
    void fitView({
      padding: 0.15,
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 250,
    });
  }, [fitView]);

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      if (node.type === "lifecycleStage") onSelect(node.id);
    },
    [onSelect],
  );
  const onNodeDoubleClick = useCallback(
    (_: unknown, node: Node) => {
      if (node.type !== "lifecycleStage") return;
      onSelect(node.id);
      onExploreStage?.(node.id);
    },
    [onSelect, onExploreStage],
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
      if (id && lifecycleStages.some((stage) => stage.id === id)) onSelect(id);
    },
    [onSelect],
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
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
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

export function WorkspaceCanvas(props: WorkspaceCanvasProps) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
