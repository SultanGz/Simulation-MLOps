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
import { getStageDiagram } from "./containerData";
import { ContainerNode, type ContainerFlowNode } from "./ContainerNode";
import {
  ContainerDetailNode,
  type ContainerDetailFlowNode,
} from "./ContainerDetailNode";

const nodeTypes = {
  container: ContainerNode,
  containerDetail: ContainerDetailNode,
};

const DETAIL_W = 620;
const DETAIL_H = 235;

interface Level2CanvasProps {
  stageId: string;
  selectedContainerId: string | null;
  onSelect: (id: string | null) => void;
  theme: "light" | "dark";
}

function Diagram({ stageId, selectedContainerId, onSelect, theme }: Level2CanvasProps) {
  const { fitView } = useReactFlow();
  const diagram = getStageDiagram(stageId);

  const nodes: Node[] = useMemo(() => {
    if (!diagram) return [];
    const containers: ContainerFlowNode[] = diagram.nodes.map((n) => ({
      id: n.id,
      type: "container",
      position: { x: n.x, y: n.y },
      data: { name: n.name, responsibility: n.responsibility, kind: n.kind },
      selected: selectedContainerId === n.id,
      draggable: false,
      ariaLabel: `${n.kind}: ${n.name}`,
    }));

    // One persistent detail window parked above the diagram grid.
    const details: ContainerDetailFlowNode[] = [];
    const sel = diagram.nodes.find((n) => n.id === selectedContainerId);
    if (sel) {
      const minY = Math.min(...diagram.nodes.map((n) => n.y));
      const minX = Math.min(...diagram.nodes.map((n) => n.x));
      const maxX = Math.max(...diagram.nodes.map((n) => n.x)) + 210;
      details.push({
        id: "container-detail",
        type: "containerDetail",
        position: {
          x: minX + (maxX - minX - DETAIL_W) / 2,
          y: minY - DETAIL_H - 70,
        },
        data: { title: sel.name, detail: sel.detail },
        style: { width: DETAIL_W },
        selectable: false,
        draggable: false,
        focusable: false,
        zIndex: 20,
      });
    }

    return [...containers, ...details];
  }, [diagram, selectedContainerId]);

  const edges: Edge[] = useMemo(
    () =>
      (diagram?.edges ?? []).map((e) => ({
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
        className:
          e.kind === "decision"
            ? "l2-edge--decision"
            : e.kind === "handoff"
              ? "l2-edge--handoff"
              : undefined,
      })),
    [diagram],
  );

  // Re-frame the whole diagram whenever the stage or selection changes.
  useEffect(() => {
    const targets = selectedContainerId
      ? [{ id: "container-detail" }, { id: selectedContainerId }]
      : diagram?.nodes.map((n) => ({ id: n.id }));
    if (targets?.length) {
      void fitView({
        nodes: targets,
        duration: 450,
        padding: selectedContainerId ? 0.3 : 0.18,
        maxZoom: 1,
      });
    }
  }, [stageId, selectedContainerId, diagram, fitView]);

  const resetView = useCallback(() => {
    void fitView({ padding: 0.18, duration: 250 });
  }, [fitView]);

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      if (node.type === "container") onSelect(node.id);
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
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.18 }}
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
      <div className="l2-legend" aria-hidden="true">
        <span><i className="l2-legend__swatch l2-legend__swatch--service" /> Service</span>
        <span><i className="l2-legend__swatch l2-legend__swatch--store" /> Data store</span>
        <span><i className="l2-legend__swatch l2-legend__swatch--external" /> External</span>
        <span><i className="l2-legend__swatch l2-legend__swatch--handoff" /> Handoff</span>
      </div>
      <button type="button" className="btn btn--ghost canvas-reset-view" onClick={resetView}>
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
