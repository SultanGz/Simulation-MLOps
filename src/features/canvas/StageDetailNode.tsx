import { useEffect, useState } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { LifecycleStage } from "../lifecycle/lifecycleData";

export type StageDetailFlowNode = Node<
  {
    stage: LifecycleStage;
    below: boolean;
    onClose: () => void;
    onExplore?: () => void;
  },
  "stageDetail"
>;

/**
 * Explanation window attached to the selected stage — stays on the canvas.
 * Sections render in a fixed order: Overview, then a left-to-right
 * Inputs → Processing → Outputs flow.
 */
export function StageDetailNode({ data }: NodeProps<StageDetailFlowNode>) {
  const { stage, below, onClose, onExplore } = data;
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [stage.id]);

  return (
    <div className="stage-detail-card nodrag nopan nowheel">
      <Handle
        id={below ? "t-top" : "t-bottom"}
        type="target"
        position={below ? Position.Top : Position.Bottom}
        className="context-handle"
      />
      {/* key restarts the fade transition when another stage is selected */}
      <div className="stage-detail-card__body" key={stage.id}>
        <header className="stage-detail-card__header">
          <div>
            <span className="stage-detail-card__label">
              Stage {stage.order} of 8
            </span>
            <h3 className="stage-detail-card__title">{stage.name}</h3>
          </div>
          <button
            type="button"
            className="stage-detail-card__close"
            onClick={onClose}
            aria-label="Close stage details"
          >
            ×
          </button>
        </header>

        <section className="stage-detail-card__section">
          <span className="stage-detail-card__label">Overview</span>
          <p className="stage-detail-card__overview">{stage.summary}</p>
        </section>

        <div className="stage-detail-card__actions">
          <button
            type="button"
            className="stage-detail-card__expand"
            aria-expanded={expanded}
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded ? "Collapse explanation" : "Expand explanation"}
          </button>
          {onExplore && (
            <button
              type="button"
              className="stage-detail-card__explore"
              onClick={onExplore}
            >
              Explore stage services
            </button>
          )}
        </div>

        {expanded && (
          <div className="stage-detail-card__flow">
            <section className="stage-detail-card__section stage-detail-card__col">
              <span className="stage-detail-card__label">Inputs</span>
              <ul>
                {stage.inputs.map((io) => (
                  <li key={io.name}>
                    <strong>{io.name}</strong> — {io.note}
                  </li>
                ))}
              </ul>
            </section>

            <span className="stage-detail-card__arrow" aria-hidden="true">
              →
            </span>

            <section className="stage-detail-card__section stage-detail-card__col">
              <span className="stage-detail-card__label">Processing</span>
              <p>{stage.processing}</p>
            </section>

            <span className="stage-detail-card__arrow" aria-hidden="true">
              →
            </span>

            <section className="stage-detail-card__section stage-detail-card__col">
              <span className="stage-detail-card__label">Outputs</span>
              <ul>
                {stage.outputs.map((io) => (
                  <li key={io.name}>
                    <strong>{io.name}</strong> — {io.note}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
