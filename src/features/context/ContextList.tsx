import { contextNodes, contextRelationships } from "./contextData";
import { lifecycleStages } from "../lifecycle/lifecycleData";

interface ContextListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Text alternative to the diagram: every element as a plain list of buttons.
 * Fully keyboard-accessible and readable by screen readers.
 */
export function ContextList({ selectedId, onSelect }: ContextListProps) {
  return (
    <section className="context-list" aria-label="Diagram elements as a list">
      <h2 className="context-list__heading">Elements in this view</h2>

      <h3 className="context-list__subheading">People and systems</h3>
      <ul>
        {contextNodes.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              className={`context-list__item${selectedId === n.id ? " context-list__item--selected" : ""}`}
              aria-pressed={selectedId === n.id}
              onClick={() => onSelect(n.id)}
            >
              <strong>{n.name}</strong> — {n.kind}. {n.description}
            </button>
          </li>
        ))}
      </ul>

      <h3 className="context-list__subheading">Relationships</h3>
      <ul>
        {contextRelationships.map((r) => {
          const source = contextNodes.find((n) => n.id === r.source)?.name;
          const target = contextNodes.find((n) => n.id === r.target)?.name;
          return (
            <li key={r.id}>
              <button
                type="button"
                className={`context-list__item${selectedId === r.id ? " context-list__item--selected" : ""}`}
                aria-pressed={selectedId === r.id}
                onClick={() => onSelect(r.id)}
              >
                <strong>{source} → {target}</strong>: {r.label}. {r.description}
              </button>
            </li>
          );
        })}
      </ul>

      <h3 className="context-list__subheading">Lifecycle stages</h3>
      <ul>
        {lifecycleStages.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className={`context-list__item${selectedId === s.id ? " context-list__item--selected" : ""}`}
              aria-pressed={selectedId === s.id}
              onClick={() => onSelect(s.id)}
            >
              <strong>
                {s.order}. {s.name}
              </strong>{" "}
              — {s.summary}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
