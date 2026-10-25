import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  MarkerType,
  type Node,
  type Edge,
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

const DETAIL_W = 620;
const DETAIL_H = 235;
const DETAIL_GAP_Y = 140;

/** Stage order → grid position (1-4 left→right, 5-8 right→left). */
function stagePosition(order: number): { x: number; y: number } {
  if (order <= 4) return { x: GRID_X + (order - 1) * STAGE_STEP, y: ROW_1_Y };
  return { x: GRID_X + (8 - order) * STAGE_STEP, y: ROW_2_Y };
}

/**
 * The detail window parks in the free lane: above row 1, below row 2 —
 * so it can never cover a stage node or a connector edge.
 */
function detailPosition(order: number): { x: number; y: number } {
  const p = stagePosition(order);
  const centered = p.x + STAGE_W / 2 - DETAIL_W / 2;
  const x = Math.max(GRID_X, Math.min(centered, GRID_X + 3 * STAGE_STEP + STAGE_W - DETAIL_W));
  const y = order <= 4 ? ROW_1_Y - DETAIL_H - DETAIL_GAP_Y : ROW_2_Y + DETAIL_GAP_Y;
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
  onSelect: (id: string | null) => void;
  theme: "light" | "dark";
}

function Canvas({
  selectedId,
  activeOrder,
  finished,
  preflightNode,
  focusId,
  onSelect,
  theme,
}: WorkspaceCanvasProps) {
  const { fitView } = useReactFlow();

  const nodes: Node[] = useMemo(() => {
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
    if (selStage) {
      const below = selStage.order > 4; // row-2 stages expand below the row
      detailNodes.push({
        id: "stage-detail",
        type: "stageDetail",
        position: detailPosition(selStage.order),
        data: { stage: selStage, below },
        style: { width: DETAIL_W },
        selectable: false,
        draggable: false,
        focusable: false,
        zIndex: 20,
      });
    }

    return [
      ...(preflightNode ? [preflightNode] : []),
      ...stages,
      ...detailNodes,
    ];
  }, [selectedId, activeOrder, finished, preflightNode]);

  const edges: Edge[] = useMemo(() => {
    // Serpentine chain: row 1 left→right, down at 4→5, row 2 right→left.
    const chain: Edge[] = lifecycleStages.slice(1).map((stage) => {
      const prev = lifecycleStages[stage.order - 2];
      const done = stage.order <= activeOrder;
      const isTurn = stage.order === 5;
      const backwards = stage.order > 5;
      return {
        id: `chain-${stage.order}`,
        source: prev.id,
        target: stage.id,
        sourceHandle: isTurn ? "s-bottom" : backwards ? "s-left" : "s-right",
        targetHandle: isTurn ? "t-top" : backwards ? "t-right" : "t-left",
        type: "smoothstep",
        className: done ? "canvas-edge--done" : undefined,
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
    if (selStage) {
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
  }, [selectedId, activeOrder, finished]);

  /* ----- camera ----- */

  // On mount: composed overview of the whole lifecycle.
  // After that, the camera frames the selected stage together with its
  // detail window so the card can never leave the viewport.
  const firstRender = useRef(true);
  useEffect(() => {
    // Preflight scenes take camera priority.
    if (focusId) {
      void fitView({
        nodes: [{ id: focusId }],
        duration: firstRender.current ? 0 : 500,
        padding: 0.35,
        maxZoom: 1,
      });
      firstRender.current = false;
      return;
    }
    if (firstRender.current) {
      firstRender.current = false;
      void fitView({ padding: 0.15 });
      return;
    }
    if (selectedId) {
      void fitView({
        nodes: [{ id: selectedId }, { id: "stage-detail" }],
        duration: 450,
        padding: 0.25,
        maxZoom: 1,
      });
    } else {
      void fitView({ padding: 0.15, duration: 400 });
    }
  }, [selectedId, focusId, fitView]);

  const resetView = useCallback(() => {
    void fitView({ padding: 0.15, duration: 250 });
  }, [fitView]);

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => onSelect(node.id),
    [onSelect],
  );
  const onPaneClick = useCallback(() => onSelect(null), [onSelect]);

  return (
    <div className="workspace-canvas">
      <ReactFlow
        colorMode={theme}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
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
        <MiniMap position="bottom-right" pannable zoomable className="workspace-minimap" />
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
