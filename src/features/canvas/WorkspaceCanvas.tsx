import { useCallback, useEffect, useMemo } from "react";
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

const nodeTypes = {
  lifecycleStage: StageNode,
  stageDetail: StageDetailNode,
};

/* ---------- Precise 4x2 serpentine layout ---------- */

const STAGE_W = 190;
const STAGE_STEP = 250; // node width + 60px gap
const ROW_1_Y = 120;
const ROW_2_Y = 520;
const GRID_X = 40;

const DETAIL_W = 360;
const DETAIL_GAP_Y = 100;

/** Stage order → grid position (1-4 left→right, 5-8 right→left). */
function stagePosition(order: number): { x: number; y: number } {
  if (order <= 4) return { x: GRID_X + (order - 1) * STAGE_STEP, y: ROW_1_Y };
  return { x: GRID_X + (8 - order) * STAGE_STEP, y: ROW_2_Y };
}

/**
 * X for the inline detail card so it never covers the vertical feedback
 * edge (x≈135, stage 8→1) or the 4→5 turn (x≈885).
 */
function detailX(order: number): number {
  const p = stagePosition(order);
  const centered = p.x + STAGE_W / 2 - DETAIL_W / 2;
  if (order === 1) return 170; // clear the feedback edge at x≈135
  if (order === 4) return 500; // clear the 4→5 connector at x≈885
  return Math.max(40, centered);
}

/* ---------- Component ---------- */

interface WorkspaceCanvasProps {
  selectedId: string | null;
  /** Stage id active in the simulation, or null when idle. */
  activeStageId: string | null;
  /** Stage order the simulation is on (0 = idle). */
  activeOrder: number;
  /** True once the simulation has run to the final stage. */
  finished: boolean;
  onSelect: (id: string | null) => void;
  theme: "light" | "dark";
}

function Canvas({
  selectedId,
  activeStageId,
  activeOrder,
  finished,
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

    // Inline detail card attached to the selected stage.
    const detailNodes: StageDetailFlowNode[] = [];
    const selStage = lifecycleStages.find((s) => s.id === selectedId);
    if (selStage) {
      const p = stagePosition(selStage.order);
      detailNodes.push({
        id: `detail-${selStage.id}`,
        type: "stageDetail",
        position: { x: detailX(selStage.order), y: p.y + DETAIL_GAP_Y },
        data: { stage: selStage, below: true },
        style: { width: DETAIL_W },
        selectable: false,
        draggable: false,
        focusable: false,
        zIndex: 20,
      });
    }

    return [...stages, ...detailNodes];
  }, [selectedId, activeOrder, finished]);

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

    // Connector from the selected stage to its inline detail card.
    const detailEdges: Edge[] = [];
    const selStage = lifecycleStages.find((s) => s.id === selectedId);
    if (selStage) {
      detailEdges.push({
        id: `detail-edge-${selStage.id}`,
        source: selStage.id,
        sourceHandle: "s-bottom",
        target: `detail-${selStage.id}`,
        targetHandle: "t-top",
        type: "smoothstep",
        className: "canvas-edge--detail",
        focusable: false,
        selectable: false,
      });
    }

    return [...chain, loop, ...detailEdges];
  }, [selectedId, activeOrder, finished]);

  /* ----- camera ----- */

  useEffect(() => {
    if (activeStageId) {
      void fitView({
        nodes: [{ id: activeStageId }],
        duration: 600,
        padding: 1.2,
        maxZoom: 1,
      });
    } else {
      void fitView({ padding: 0.15, duration: 600 });
    }
  }, [activeStageId, fitView]);

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
