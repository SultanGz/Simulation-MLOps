import { lifecycleStages } from "./lifecycleData";

interface LifecycleSectionProps {
  /** Stage id currently active in the simulation, or null when idle. */
  activeStageId: string | null;
  selectedStageId: string | null;
  onSelect: (id: string | null) => void;
}

/**
 * The lifecycle journey simulation-MLOps teaches — shown as a dedicated
 * section of selectable cards. Cards also act as a text alternative for
 * whichever stage the simulation is currently highlighting.
 */
export function LifecycleSection({
  activeStageId,
  selectedStageId,
  onSelect,
}: LifecycleSectionProps) {
  return (
    <section className="lifecycle" aria-label="The MLOps lifecycle">
      <h2 className="lifecycle__heading">The MLOps lifecycle</h2>
      <p className="lifecycle__intro">
        The journey this website simulates. These are provider-neutral stages —
        real platforms organize them differently.
      </p>
      <ol className="lifecycle__grid">
        {lifecycleStages.map((stage) => {
          const active = stage.id === activeStageId;
          const selected = stage.id === selectedStageId;
          const classes = [
            "stage-card",
            active ? "stage-card--active" : "",
            selected ? "stage-card--selected" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <li key={stage.id}>
              <button
                type="button"
                className={classes}
                aria-pressed={selected}
                aria-current={active ? "step" : undefined}
                onClick={() => onSelect(selected ? null : stage.id)}
              >
                <span className="stage-card__order">{stage.order}</span>
                <span className="stage-card__name">{stage.name}</span>
                <span className="stage-card__summary">{stage.summary}</span>
                <span className="stage-card__io">
                  <span className="stage-card__io-label">Input:</span> {stage.input}
                </span>
                <span className="stage-card__io">
                  <span className="stage-card__io-label">Output:</span> {stage.output}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
