import { getElement } from "./contextData";

export function DetailPanel({ selectedId }: { selectedId: string | null }) {
  const element = selectedId ? getElement(selectedId) : undefined;

  return (
    <aside className="detail-panel" aria-live="polite" aria-label="Selected element details">
      {element ? (
        <>
          <span className="detail-panel__kind">{element.kind}</span>
          <h2 className="detail-panel__name">
            {"name" in element ? element.name : element.label}
          </h2>
          <p className="detail-panel__description">{element.description}</p>
        </>
      ) : (
        <>
          <span className="detail-panel__kind">Nothing selected</span>
          <h2 className="detail-panel__name">Select an element</h2>
          <p className="detail-panel__description">
            Click a person, the system, or a relationship in the diagram — or pick
            one from the list below — to see what it represents.
          </p>
        </>
      )}
    </aside>
  );
}
