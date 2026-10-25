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
      <Handle type="target" position={Position.Left} className="context-handle" />
      <Handle type="source" position={Position.Right} className="context-handle" />
      <span className="stage-node__dot" aria-hidden="true">
        {data.state === "completed" ? "✓" : data.stage.order}
      </span>
      <span className="stage-node__name">{data.stage.name}</span>
    </div>
  );
}
