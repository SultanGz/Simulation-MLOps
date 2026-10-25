import { useCallback, useState } from "react";
import { ContextDiagram } from "./features/context/ContextDiagram";
import { DetailPanel } from "./features/context/DetailPanel";
import { ContextList } from "./features/context/ContextList";
import {
  initialSimulationState,
  start,
  advance,
  reset,
  type SimulationState,
} from "./features/simulation/simulation";

const levels = [
  { id: 1, label: "Level 1 · System Context", enabled: true },
  { id: 2, label: "Level 2 · Containers", enabled: false },
  { id: 3, label: "Level 3 · Components", enabled: false },
  { id: 4, label: "Level 4 · Code", enabled: false },
];

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sim, setSim] = useState<SimulationState>(initialSimulationState);

  const onStart = useCallback(() => setSim(start), []);
  const onNext = useCallback(() => setSim((s) => advance(s)), []);
  const onReset = useCallback(() => setSim(reset()), []);

  return (
    <div className="app">
      <header className="site-header">
        <h1 className="site-header__title">simulation-MLOps</h1>
        <p className="site-header__purpose">
          Learn the MLOps lifecycle by stepping through guided, in-browser
          simulations — no accounts, no external services.
        </p>
      </header>

      <nav className="level-nav" aria-label="C4 diagram levels">
        {levels.map((l) =>
          l.enabled ? (
            <button
              key={l.id}
              type="button"
              className="level-nav__tab level-nav__tab--active"
              aria-current="page"
            >
              {l.label}
            </button>
          ) : (
            <button
              key={l.id}
              type="button"
              className="level-nav__tab"
              disabled
              title="Planned — not available in this milestone"
            >
              {l.label}
              <span className="level-nav__badge">planned</span>
            </button>
          ),
        )}
      </nav>

      <main>
        <section className="sim-controls" aria-label="Sample simulation controls">
          <div className="sim-controls__buttons">
            <button type="button" className="btn" onClick={onStart} disabled={sim.started}>
              Start
            </button>
            <button
              type="button"
              className="btn"
              onClick={onNext}
              disabled={!sim.started || sim.finished}
            >
              Next
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onReset}
              disabled={!sim.started && sim.stepIndex === 0}
            >
              Reset
            </button>
          </div>
          <div className="sim-controls__status" role="status" aria-live="polite">
            <strong>{sim.step.status}</strong>
            <p>{sim.step.description}</p>
          </div>
        </section>

        <section className="diagram-layout" aria-label="System context diagram">
          <ContextDiagram
            selectedId={selectedId}
            highlightedNodeIds={sim.step.highlightedNodeIds}
            highlightedEdgeIds={sim.step.highlightedEdgeIds}
            onSelect={setSelectedId}
          />
          <DetailPanel selectedId={selectedId} />
        </section>

        <ContextList selectedId={selectedId} onSelect={setSelectedId} />
      </main>
    </div>
  );
}
