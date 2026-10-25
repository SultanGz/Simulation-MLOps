import { useEffect, useState } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { ContainerDetail } from "./containerData";

export type ContainerDetailFlowNode = Node<
  { title: string; detail: ContainerDetail; onClose: () => void },
  "containerDetail"
>;

/** Same on-canvas explanation window pattern as Level 1's stage card. */
export function ContainerDetailNode({
  data,
}: NodeProps<ContainerDetailFlowNode>) {
  const { title, detail, onClose } = data;
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [title]);

  return (
    <div className="stage-detail-card nodrag nopan nowheel">
      <Handle
        id="t-bottom"
        type="target"
        position={Position.Bottom}
        className="context-handle"
      />
      <div className="stage-detail-card__body" key={title}>
        <header className="stage-detail-card__header">
          <div>
            <span className="stage-detail-card__label">Service</span>
            <h3 className="stage-detail-card__title">{title}</h3>
          </div>
          <button
            type="button"
            className="stage-detail-card__close"
            onClick={onClose}
            aria-label="Close service details"
          >
            ×
          </button>
        </header>

        <section className="stage-detail-card__section">
          <span className="stage-detail-card__label">Overview</span>
          <p className="stage-detail-card__overview">{detail.overview}</p>
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
        </div>

        {expanded && (
          <div className="stage-detail-card__flow">
            <section className="stage-detail-card__section stage-detail-card__col">
              <span className="stage-detail-card__label">Inputs</span>
              <ul>
                {detail.inputs.map((io) => (
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
              <p>{detail.processing}</p>
            </section>
            <span className="stage-detail-card__arrow" aria-hidden="true">
              →
            </span>
            <section className="stage-detail-card__section stage-detail-card__col">
              <span className="stage-detail-card__label">Outputs</span>
              <ul>
                {detail.outputs.map((io) => (
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
