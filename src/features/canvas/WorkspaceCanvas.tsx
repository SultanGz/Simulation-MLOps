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
import { RegionNode, type RegionFlowNode } from "./RegionNode";

const nodeTypes = {
  contextElement: ContextNodeView,
  lifecycleStage: StageNode,
  region: RegionNode,
};

/* ---------- Curated spatial layout ---------- */

const CONTEXT_REGION = { x: -90, y: -90, w: 900, h: 470 };
const LIFECYCLE_REGION = { x: -90, y: 620, w: 1900, h: 230 };

const contextPositions: Record<string, { x: number; y: number }> = {
  learner: { x: 10, y: 90 },
  system: { x: 570, y: 90 },
  instructor: { x: 260, y: 300 },
};

const STAGE_GAP = 235;
const STAGE_Y = 730;
const stagePosition = (order: number) => ({
  x: (order - 1) * STAGE_GAP,
  y: STAGE_Y,
});

/** Parallel learner↔system edges are offset so their labels never overlap. */
const contextEdgeOffsets: Record<string, number> = {
  "learner-selects": 26,
  "system-explains": -26,
  "instructor-facilitates": 0,
};

/* ---------- Component ---------- */

interface WorkspaceCanvasProps {
  selectedId: string | null;
  /** Stage id active in the simulation, or null when idle. */
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
    const regions: RegionFlowNode[] = [
      {
        id: "region-context",
        type: "region",
        position: { x: CONTEXT_REGION.x, y: CONTEXT_REGION.y },
        data: {
          title: "System Context",
          subtitle: "C4 Level 1 — who uses simulation-MLOps",
        },
        style: { width: CONTEXT_REGION.w, height: CONTEXT_REGION.h },
        selectable: false,
        draggable: false,
        focusable: false,
        zIndex: -10,
        className: "region-node",
      },
      {
        id: "region-lifecycle",
        type: "region",
        position: { x: LIFECYCLE_REGION.x, y: LIFECYCLE_REGION.y },
        data: {
          title: "MLOps Lifecycle",
          subtitle: "The eight provider-neutral stages the site simulates",
        },
        style: { width: LIFECYCLE_REGION.w, height: LIFECYCLE_REGION.h },
        selectable: false,
        draggable: false,
        focusable: false,
        zIndex: -10,
        className: "region-node",
      },
    ];

    const context: ContextFlowNode[] = contextNodes.map((element) => ({
      id: element.id,
      type: "contextElement",
      position: contextPositions[element.id],
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

    return [...regions, ...context, ...stages];
  }, [highlightedNodeIds, selectedId, activeOrder]);

  /* ----- edges ----- */

  const edges: Edge[] = useMemo(() => {
    const context: Edge[] = contextRelationships.map((rel) => {
      const highlighted = highlightedEdgeIds.includes(rel.id);
      return {
        id: rel.id,
        source: rel.source,
        target: rel.target,
        type: "smoothstep",
        pathOptions: { offset: contextEdgeOffsets[rel.id] ?? 0 },
        label: rel.label,
        selected: selectedId === rel.id,
        markerEnd: { type: MarkerType.ArrowClosed },
        className: highlighted ? "canvas-edge--highlighted" : undefined,
        labelStyle: { fontSize: 11, fill: "var(--ink)" },
        labelBgStyle: { fill: "var(--paper)" },
        labelBgPadding: [6, 3] as [number, number],
        ariaLabel: `Relationship: ${rel.label}`,
        style: highlighted ? { strokeWidth: 2.5 } : undefined,
      };
    });

    const chain: Edge[] = lifecycleStages.slice(1).map((stage) => {
      const done = stage.order <= activeOrder;
      return {
        id: `chain-${stage.order}`,
        source: lifecycleStages[stage.order - 2].id,
        target: stage.id,
        type: "smoothstep",
        className: done ? "canvas-edge--done" : undefined,
        markerEnd: { type: MarkerType.ArrowClosed },
        focusable: false,
      };
    });

    return [...context, ...chain];
  }, [highlightedEdgeIds, selectedId, activeOrder]);

  /* ----- camera ----- */

  // When the simulation moves to a stage, glide the camera to it.
  // Idle/reset returns to the composed overview.
  useEffect(() => {
    if (activeStageId) {
      void fitView({
        nodes: [{ id: activeStageId }],
        duration: 600,
        padding: 0.9,
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
  const onEdgeClick = useCallback(
    (_: unknown, edge: Edge) => {
      if (!edge.id.startsWith("chain-")) onSelect(edge.id);
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
        fitViewOptions={{ padding: 0.15 }}
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
