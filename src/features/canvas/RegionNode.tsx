import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";

export type BoundaryFlowNode = Node<{ selected: boolean }, "boundary">;

/**
 * The single system boundary: "simulation-MLOps".
 * Lifecycle stages live inside it; actors outside connect to its left edge.
 */
export function BoundaryNode({ data }: NodeProps<BoundaryFlowNode>) {
  return (
    <div className={`boundary${data.selected ? " boundary--selected" : ""}`}>
      <div className="boundary__label">
        <strong>simulation-MLOps</strong>
        <span>Software system — interactive website for learning the MLOps lifecycle</span>
      </div>
      {/* Relationship endpoints on the boundary's left edge */}
      <Handle id="in-learner" type="target" position={Position.Left} style={{ top: "26%" }} />
      <Handle id="out-learner" type="source" position={Position.Left} style={{ top: "40%" }} />
      <Handle id="in-instructor" type="target" position={Position.Left} style={{ top: "72%" }} />
    </div>
  );
}
