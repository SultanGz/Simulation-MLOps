import { lifecycleStages } from "./lifecycleData";

interface LifecycleSectionProps {
  /** Stage id currently active in the simulation, or null when idle. */
  activeStageId: string | null;
  selectedStageId: string | null;
  onSelect: (id: string | null) => void;
}

/**
 * Compact strip of the eight lifecycle stages — number and short name only.
 * Selecting a stage shows its summary and inputs/outputs in the detail panel.
 */
export function LifecycleSection({
  activeStageId,
  selectedStageId,
  onSelect,
}: LifecycleSectionProps) {
  return (
    <section className="lifecycle" aria-label="The MLOps lifecycle stages">
      <h2 className="lifecycle__heading">MLOps lifecycle</h2>
      <ol className="stage-strip">
        {lifecycleStages.map((stage) => {
          const active = stage.id === activeStageId;
          const selected = stage.id === selectedStageId;
          const classes = [
            "stage-pill",
            active ? "stage-pill--active" : "",
            selected ? "stage-pill--selected" : "",
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
                title={stage.name}
                onClick={() => onSelect(selected ? null : stage.id)}
              >
                <span className="stage-pill__order">{stage.order}</span>
                <span className="stage-pill__name">{stage.name}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
