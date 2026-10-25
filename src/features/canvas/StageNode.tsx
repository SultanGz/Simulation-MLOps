import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { LifecycleStage } from "../lifecycle/lifecycleData";

export type StageFlowNode = Node<
  {
    stage: LifecycleStage;
    state: "upcoming" | "current" | "completed";
    selected: boolean;
  },
  "lifecycleStage"
>;

/** Compact lifecycle stage node: number dot + short name only. */
export function StageNode({ data, selected }: NodeProps<StageFlowNode>) {
  const classes = [
    "stage-node",
    `stage-node--${data.state}`,
    selected ? "stage-node--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <Handle id="t-left" type="target" position={Position.Left} className="context-handle" />
      <Handle id="t-right" type="target" position={Position.Right} className="context-handle" />
      <Handle id="t-top" type="target" position={Position.Top} className="context-handle" />
      <Handle id="s-left" type="source" position={Position.Left} className="context-handle" />
      <Handle id="s-right" type="source" position={Position.Right} className="context-handle" />
      <Handle id="s-bottom" type="source" position={Position.Bottom} className="context-handle" />
      <Handle id="s-top" type="source" position={Position.Top} className="context-handle" />
      <span className="stage-node__dot" aria-hidden="true">
        {data.state === "completed" ? "✓" : data.stage.order}
      </span>
      <span className="stage-node__name">{data.stage.name}</span>
    </div>
  );
}
