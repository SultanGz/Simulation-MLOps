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
  learner: { x: 0, y: 40 },
  system: { x: 360, y: 40 },
  instructor: { x: 180, y: 260 },
};

interface ContextDiagramProps {
  selectedId: string | null;
  highlightedNodeIds: string[];
  highlightedEdgeIds: string[];
  onSelect: (id: string | null) => void;
}

function Flow({ selectedId, highlightedNodeIds, highlightedEdgeIds, onSelect }: ContextDiagramProps) {
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
          label: rel.label,
          selected: selectedId === rel.id,
          markerEnd: { type: MarkerType.ArrowClosed },
          className: highlighted ? "context-edge--highlighted" : undefined,
          labelStyle: { fontSize: 11 },
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
