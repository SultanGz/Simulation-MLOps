import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { ContextNode } from "./contextData";

export type ContextFlowNode = Node<
  { element: ContextNode; highlighted: boolean; selected: boolean },
  "contextElement"
>;

export function ContextNodeView({ data }: NodeProps<ContextFlowNode>) {
  const { element, highlighted } = data;
  const classes = [
    "context-node",
    element.kind === "Person" ? "context-node--person" : "context-node--system",
    highlighted ? "context-node--highlighted" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <Handle type="target" position={Position.Left} className="context-handle" />
      <Handle type="source" position={Position.Left} className="context-handle" />
      <Handle type="target" position={Position.Right} className="context-handle" />
      <Handle type="source" position={Position.Right} className="context-handle" />
      <span className="context-node__kind">{element.kind}</span>
      <strong className="context-node__name">{element.name}</strong>
      <span className="context-node__tagline">{element.tagline}</span>
    </div>
  );
}
