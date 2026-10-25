import { getElement } from "./contextData";
import { lifecycleStages } from "../lifecycle/lifecycleData";
import { ContextList } from "./ContextList";

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
      kind: `Lifecycle stage ${stage.order} of ${lifecycleStages.length}`,
      title: stage.name,
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

interface DetailPanelProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/**
 * Screen-fixed inspector: a concise read-out for whatever was last selected —
 * person, system, relationship, or lifecycle stage. The full element list
 * stays available behind a collapsed disclosure as the text alternative.
 */
export function DetailPanel({ selectedId, onSelect }: DetailPanelProps) {
  const detail = selectedId ? resolveDetail(selectedId) : undefined;

  return (
    <aside className="inspector" aria-live="polite" aria-label="Inspector">
      {detail ? (
        <>
          <span className="inspector__kind">{detail.kind}</span>
          <h2 className="inspector__name">{detail.title}</h2>
          <p className="inspector__description">{detail.description}</p>
          {detail.input && (
            <div className="inspector__io">
              <h3>Input</h3>
              <p>{detail.input}</p>
            </div>
          )}
          {detail.output && (
            <div className="inspector__io">
              <h3>Output</h3>
              <p>{detail.output}</p>
            </div>
          )}
        </>
      ) : (
        <>
          <span className="inspector__kind">Nothing selected</span>
          <h2 className="inspector__name">Select an element</h2>
          <p className="inspector__description">
            Select a person, the system, a relationship, or a lifecycle stage on
            the canvas to see a short explanation.
          </p>
        </>
      )}

      <details className="inspector__contents">
        <summary>Canvas contents (text alternative)</summary>
        <ContextList selectedId={selectedId} onSelect={onSelect} />
      </details>
    </aside>
  );
}
