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
import { contextNodes, contextRelationships } from "../context/contextData";
import { lifecycleStages } from "../lifecycle/lifecycleData";
import { ContextNodeView, type ContextFlowNode } from "../context/ContextNode";
import { StageNode, type StageFlowNode } from "./StageNode";
import { BoundaryNode, type BoundaryFlowNode } from "./RegionNode";
import { StageDetailNode, type StageDetailFlowNode } from "./StageDetailNode";

const nodeTypes = {
  contextElement: ContextNodeView,
  lifecycleStage: StageNode,
  boundary: BoundaryNode,
  stageDetail: StageDetailNode,
};

/* ---------- Curated layout: one boundary, actors left, 4x2 serpentine ---------- */

const STAGE_W = 190;
const STAGE_STEP = 250; // node width + 60px gap
const ROW_1_Y = 140;
const ROW_2_Y = 560;
const INNER_X = 320;

const BOUNDARY = { x: 280, y: 0, w: 1020, h: 880 };
const DETAIL_W = 360;
const DETAIL_GAP_Y = 95;

const actorPositions: Record<string, { x: number; y: number }> = {
  learner: { x: 0, y: 100 },
  instructor: { x: 0, y: 470 },
};

/** Stage order → grid position (serpentine: 1-4 L→R, 5-8 R→L). */
function stagePosition(order: number): { x: number; y: number } {
  if (order <= 4) return { x: INNER_X + (order - 1) * STAGE_STEP, y: ROW_1_Y };
  // stages 5-8 sit right-to-left on the second row
  return { x: INNER_X + (8 - order) * STAGE_STEP, y: ROW_2_Y };
}

/* ---------- Component ---------- */

interface WorkspaceCanvasProps {
  selectedId: string | null;
  activeStageId: string | null;
  /** Stage order the simulation is on (0 = idle). */
  activeOrder: number;
  highlightedNodeIds: string[];
  highlightedEdgeIds: string[];
  onSelect: (id: string | null) => void;
  theme: "light" | "dark";
}

function Canvas({
  selectedId,
  activeStageId,
  activeOrder,
  highlightedNodeIds,
  highlightedEdgeIds,
  onSelect,
  theme,
}: WorkspaceCanvasProps) {
  const { fitView } = useReactFlow();

  /* ----- nodes ----- */

  const nodes: Node[] = useMemo(() => {
    const boundary: BoundaryFlowNode = {
      id: "boundary",
      type: "boundary",
      position: { x: BOUNDARY.x, y: BOUNDARY.y },
      data: { selected: selectedId === "system" },
      style: { width: BOUNDARY.w, height: BOUNDARY.h },
      draggable: false,
      zIndex: -10,
      className: "boundary-node",
      ariaLabel: "Software system: simulation-MLOps",
    };

    const actors: ContextFlowNode[] = contextNodes
      .filter((n) => n.id !== "system")
      .map((element) => ({
        id: element.id,
        type: "contextElement",
        position: actorPositions[element.id],
        data: {
          element,
          highlighted: highlightedNodeIds.includes(element.id),
          selected: selectedId === element.id,
        },
        selected: selectedId === element.id,
        draggable: false,
        ariaLabel: `${element.kind}: ${element.name}`,
      }));

    const stages: StageFlowNode[] = lifecycleStages.map((stage) => {
      const state =
        stage.order < activeOrder
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

    // Inline detail card for the selected stage — inside the boundary,
    // below row-1 stages, below row-2 stages into the reserved lane.
    const detailNodes: StageDetailFlowNode[] = [];
    const selStage = lifecycleStages.find((s) => s.id === selectedId);
    if (selStage) {
      const p = stagePosition(selStage.order);
      // Center the card under the stage; keep it inside the boundary and
      // clear of the 4→5 vertical connector on the right.
      const cx = p.x + STAGE_W / 2 - DETAIL_W / 2;
      const maxX =
        selStage.order === 4 ? 770 : BOUNDARY.x + BOUNDARY.w - DETAIL_W - 40;
      detailNodes.push({
        id: `detail-${selStage.id}`,
        type: "stageDetail",
        position: {
          x: Math.max(BOUNDARY.x + 40, Math.min(cx, maxX)),
          y: p.y + DETAIL_GAP_Y + 5,
        },
        data: { stage: selStage, below: true },
        style: { width: DETAIL_W },
        selectable: false,
        draggable: false,
        focusable: false,
        zIndex: 20,
      });
    }

    return [boundary, ...actors, ...stages, ...detailNodes];
  }, [highlightedNodeIds, selectedId, activeOrder]);

  /* ----- edges ----- */

  const edges: Edge[] = useMemo(() => {
    const rel = (id: string) =>
      contextRelationships.find((r) => r.id === id)!;

    const actorEdges: Edge[] = [
      {
        id: rel("learner-selects").id,
        source: "learner",
        target: "boundary",
        targetHandle: "in-learner",
        type: "smoothstep",
        label: rel("learner-selects").label,
        selected: selectedId === "learner-selects",
        markerEnd: { type: MarkerType.ArrowClosed },
        className: highlightedEdgeIds.includes("learner-selects")
          ? "canvas-edge--highlighted"
          : undefined,
        labelStyle: { fontSize: 11, fill: "var(--ink)" },
        labelBgStyle: { fill: "var(--paper)" },
        labelBgPadding: [6, 3] as [number, number],
        ariaLabel: `Relationship: ${rel("learner-selects").label}`,
      },
      {
        id: rel("system-explains").id,
        source: "boundary",
        sourceHandle: "out-learner",
        target: "learner",
        type: "smoothstep",
        label: rel("system-explains").label,
        selected: selectedId === "system-explains",
        markerEnd: { type: MarkerType.ArrowClosed },
        className: highlightedEdgeIds.includes("system-explains")
          ? "canvas-edge--highlighted"
          : undefined,
        labelStyle: { fontSize: 11, fill: "var(--ink)" },
        labelBgStyle: { fill: "var(--paper)" },
        labelBgPadding: [6, 3] as [number, number],
        ariaLabel: `Relationship: ${rel("system-explains").label}`,
      },
      {
        id: rel("instructor-facilitates").id,
        source: "instructor",
        target: "boundary",
        targetHandle: "in-instructor",
        type: "smoothstep",
        label: rel("instructor-facilitates").label,
        selected: selectedId === "instructor-facilitates",
        markerEnd: { type: MarkerType.ArrowClosed },
        className: highlightedEdgeIds.includes("instructor-facilitates")
          ? "canvas-edge--highlighted"
          : undefined,
        labelStyle: { fontSize: 11, fill: "var(--ink)" },
        labelBgStyle: { fill: "var(--paper)" },
        labelBgPadding: [6, 3] as [number, number],
        ariaLabel: `Relationship: ${rel("instructor-facilitates").label}`,
      },
    ];

    // Serpentine chain: row 1 left→right, down at 4→5, row 2 right→left.
    const chain: Edge[] = lifecycleStages.slice(1).map((stage) => {
      const prev = lifecycleStages[stage.order - 2];
      const done = stage.order <= activeOrder;
      const isTurn = stage.order === 5;
      const backwards = stage.order > 5; // row 2 runs right→left
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

    return [...actorEdges, ...chain, ...detailEdges];
  }, [highlightedEdgeIds, selectedId, activeOrder]);

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
      void fitView({ padding: 0.12, duration: 600 });
    }
  }, [activeStageId, fitView]);

  const resetView = useCallback(() => {
    void fitView({ padding: 0.12, duration: 250 });
  }, [fitView]);

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      onSelect(node.id === "boundary" ? "system" : node.id);
    },
    [onSelect],
  );
  const onEdgeClick = useCallback(
    (_: unknown, edge: Edge) => {
      if (!edge.id.startsWith("chain-") && !edge.id.startsWith("detail-")) {
        onSelect(edge.id);
      }
    },
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
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.15}
        maxZoom={1.6}
        nodesFocusable
        edgesFocusable
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
