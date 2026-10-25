import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { LifecycleStage } from "../lifecycle/lifecycleData";

export type StageDetailFlowNode = Node<
  { stage: LifecycleStage; below: boolean },
  "stageDetail"
>;

/**
 * Inline detail card attached to the selected stage — shows the stage's
 * summary plus its labeled Inputs and Outputs directly on the canvas.
 */
export function StageDetailNode({ data }: NodeProps<StageDetailFlowNode>) {
  const { stage, below } = data;
  return (
    <div className="stage-detail-card">
      <Handle
        id={below ? "t-top" : "t-bottom"}
        type="target"
        position={below ? Position.Top : Position.Bottom}
        className="context-handle"
      />
      <div className="stage-detail-card__row">
        <span className="stage-detail-card__label">Does</span>
        <span>{stage.summary}</span>
      </div>
      <div className="stage-detail-card__row">
        <span className="stage-detail-card__label">Input</span>
        <span>{stage.input}</span>
      </div>
      <div className="stage-detail-card__row">
        <span className="stage-detail-card__label">Output</span>
        <span>{stage.output}</span>
      </div>
    </div>
  );
}
