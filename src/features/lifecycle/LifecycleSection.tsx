import { lifecycleStages } from "./lifecycleData";

interface LifecycleSectionProps {
  /** Stage order currently active in the simulation (1–8), or 0 when idle. */
  activeOrder: number;
  selectedStageId: string | null;
  onSelect: (id: string | null) => void;
}

/**
 * The lifecycle journey as a connected, numbered sequence.
 *
 * Inspecting a stage (clicking it) is independent of simulation progress:
 * the detail area shows the selected stage — or, when nothing is explicitly
 * selected, the active simulation stage — without advancing anything.
 */
export function LifecycleSection({
  activeOrder,
  selectedStageId,
  onSelect,
}: LifecycleSectionProps) {
  const shownStage =
    lifecycleStages.find((s) => s.id === selectedStageId) ??
    lifecycleStages.find((s) => s.order === activeOrder) ??
    lifecycleStages[0];

  return (
    <section className="lifecycle" aria-label="The MLOps lifecycle">
      <div className="lifecycle__head">
        <h2 className="lifecycle__heading">The MLOps lifecycle</h2>
        <p className="lifecycle__intro">
          The provider-neutral journey this site simulates — select any stage to
          inspect it.
        </p>
      </div>

      <ol className="stage-seq">
        {lifecycleStages.map((stage) => {
          const current = stage.order === activeOrder;
          const completed = activeOrder > 0 && stage.order < activeOrder;
          const selected = stage.id === selectedStageId;
          const classes = [
            "stage-step",
            current ? "stage-step--current" : "",
            completed ? "stage-step--completed" : "",
            selected ? "stage-step--selected" : "",
          ]
            .filter(Boolean)
            .join(" ");
          const itemClass = `stage-seq__item${
            stage.order < activeOrder ? " stage-seq__item--done-path" : ""
          }`;
          return (
            <li key={stage.id} className={itemClass}>
              <button
                type="button"
                className={classes}
                aria-pressed={selected}
                aria-current={current ? "step" : undefined}
                onClick={() => onSelect(selected ? null : stage.id)}
              >
                <span className="stage-step__dot" aria-hidden="true">
                  {completed ? "✓" : stage.order}
                </span>
                <span className="stage-step__name">{stage.name}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="stage-detail" aria-live="polite" aria-label="Selected stage details">
        <div className="stage-detail__head">
          <span className="stage-detail__order">Stage {shownStage.order} of {lifecycleStages.length}</span>
          <h3 className="stage-detail__name">{shownStage.name}</h3>
        </div>
        <p className="stage-detail__summary">{shownStage.summary}</p>
        <dl className="stage-detail__io">
          <div>
            <dt>Input</dt>
            <dd>{shownStage.input}</dd>
          </div>
          <div>
            <dt>Output</dt>
            <dd>{shownStage.output}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
