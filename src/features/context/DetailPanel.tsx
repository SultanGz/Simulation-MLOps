import { getElement } from "./contextData";
import { lifecycleStages } from "../lifecycle/lifecycleData";

interface Detail {
  kind: string;
  title: string;
  description: string;
  input?: string;
  output?: string;
}

function resolveDetail(id: string): Detail | undefined {
  const stage = lifecycleStages.find((s) => s.id === id);
  if (stage) {
    return {
      kind: "Lifecycle stage",
      title: `${stage.order}. ${stage.name}`,
      description: stage.summary,
      input: stage.input,
      output: stage.output,
    };
  }
  const element = getElement(id);
  if (!element) return undefined;
  return {
    kind: element.kind,
    title: "name" in element ? element.name : element.label,
    description: element.description,
  };
}

export function DetailPanel({ selectedId }: { selectedId: string | null }) {
  const detail = selectedId ? resolveDetail(selectedId) : undefined;

  return (
    <aside className="detail-panel" aria-live="polite" aria-label="Selected element details">
      {detail ? (
        <>
          <span className="detail-panel__kind">{detail.kind}</span>
          <h2 className="detail-panel__name">{detail.title}</h2>
          <p className="detail-panel__description">{detail.description}</p>
          {detail.input && (
            <p className="detail-panel__io">
              <strong>Input:</strong> {detail.input}
            </p>
          )}
          {detail.output && (
            <p className="detail-panel__io">
              <strong>Output:</strong> {detail.output}
            </p>
          )}
        </>
      ) : (
        <>
          <span className="detail-panel__kind">Nothing selected</span>
          <h2 className="detail-panel__name">Select an element</h2>
          <p className="detail-panel__description">
            Select a person, the system, a relationship, or a lifecycle stage to
            see a short explanation.
          </p>
        </>
      )}
    </aside>
  );
}
