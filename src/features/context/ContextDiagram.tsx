import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useReactFlow,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { contextNodes, contextRelationships } from "./contextData";
import { ContextNodeView, type ContextFlowNode } from "./ContextNode";

const nodeTypes = { contextElement: ContextNodeView };

/** Fixed, guided positions — no drag-to-author editing. */
const nodePositions: Record<string, { x: number; y: number }> = {
  learner: { x: 0, y: 90 },
  system: { x: 460, y: 90 },
  instructor: { x: 210, y: 320 },
};

/** Parallel learner↔system edges are offset so their labels never overlap. */
const edgeStyles: Record<string, { offset: number }> = {
  "learner-selects": { offset: 26 },
  "system-explains": { offset: -26 },
  "instructor-facilitates": { offset: 0 },
};

interface ContextDiagramProps {
  selectedId: string | null;
  highlightedNodeIds: string[];
  highlightedEdgeIds: string[];
  onSelect: (id: string | null) => void;
  theme: "light" | "dark";
}

function Flow({ selectedId, highlightedNodeIds, highlightedEdgeIds, onSelect, theme }: ContextDiagramProps) {
  const { fitView } = useReactFlow();

  const nodes: Node[] = useMemo(
    () =>
      contextNodes.map((element): ContextFlowNode => {
        const highlighted = highlightedNodeIds.includes(element.id);
        return {
          id: element.id,
          type: "contextElement",
          position: nodePositions[element.id],
          data: {
            element,
            highlighted,
            selected: selectedId === element.id,
          },
          selected: selectedId === element.id,
          draggable: false,
          ariaLabel: `${element.kind}: ${element.name}`,
        };
      }),
    [highlightedNodeIds, selectedId],
  );

  const edges: Edge[] = useMemo(
    () =>
      contextRelationships.map((rel) => {
        const highlighted = highlightedEdgeIds.includes(rel.id);
        return {
          id: rel.id,
          source: rel.source,
          target: rel.target,
          type: "smoothstep",
          pathOptions: { offset: edgeStyles[rel.id]?.offset ?? 0 },
          label: rel.label,
          selected: selectedId === rel.id,
          markerEnd: { type: MarkerType.ArrowClosed },
          className: highlighted ? "context-edge--highlighted" : undefined,
          labelStyle: { fontSize: 11, fill: "var(--ink)" },
          labelBgStyle: { fill: "var(--paper)" },
          labelBgPadding: [6, 3] as [number, number],
          ariaLabel: `Relationship: ${rel.label}`,
          style: highlighted ? { strokeWidth: 2.5 } : undefined,
        };
      }),
    [highlightedEdgeIds, selectedId],
  );

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => onSelect(node.id),
    [onSelect],
  );
  const onEdgeClick = useCallback(
    (_: unknown, edge: Edge) => onSelect(edge.id),
    [onSelect],
  );
  const onPaneClick = useCallback(() => onSelect(null), [onSelect]);
  const resetView = useCallback(() => {
    void fitView({ padding: 0.2, duration: 200 });
  }, [fitView]);

  return (
    <div className="diagram-canvas">
      <ReactFlow
        colorMode={theme}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.4}
        maxZoom={1.6}
        nodesFocusable
        edgesFocusable
        elementsSelectable
        autoPanOnNodeFocus
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        deleteKeyCode={null}
      >
        <Background gap={24} />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>
      <button type="button" className="btn btn--ghost diagram-reset-view" onClick={resetView}>
        Reset view
      </button>
    </div>
  );
}

export function ContextDiagram(props: ContextDiagramProps) {
  return (
    <ReactFlowProvider>
      <Flow {...props} />
    </ReactFlowProvider>
  );
}
