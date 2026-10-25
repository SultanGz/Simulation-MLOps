import { useCallback, useEffect, useState } from "react";
import { ContextDiagram } from "./features/context/ContextDiagram";
import { DetailPanel } from "./features/context/DetailPanel";
import { ContextList } from "./features/context/ContextList";
import { LifecycleSection } from "./features/lifecycle/LifecycleSection";
import { lifecycleStages } from "./features/lifecycle/lifecycleData";
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

type Theme = "light" | "dark";

export default function App() {
  const [theme, setTheme] = useState<Theme>("light");
  const [selectedId, setSelectedId] = useState<string | null>("system");
  const [sim, setSim] = useState<SimulationState>(initialSimulationState);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Keep the detail panel focused on whichever stage the simulation is on.
  useEffect(() => {
    if (sim.step.activeStageId) setSelectedId(sim.step.activeStageId);
  }, [sim.stepIndex, sim.step.activeStageId]);

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "light" ? "dark" : "light")),
    [],
  );
  const onStart = useCallback(() => setSim(start), []);
  const onNext = useCallback(() => setSim((s) => advance(s)), []);
  const onReset = useCallback(() => {
    setSim(reset());
    setSelectedId("system");
  }, []);

  const progress = !sim.started
    ? "Not started"
    : sim.finished
      ? "Complete — all 8 stages"
      : `Stage ${sim.stepIndex} of ${lifecycleStages.length}`;

  return (
    <div className="app">
      <header className="site-header">
        <div className="site-header__row">
          <div>
            <h1 className="site-header__title">simulation-MLOps</h1>
            <p className="site-header__purpose">
              Learn the MLOps lifecycle through guided in-browser simulations.
            </p>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={toggleTheme}
            aria-pressed={theme === "dark"}
          >
            {theme === "light" ? "Dark theme" : "Light theme"}
          </button>
        </div>
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
        <section className="sim-controls" aria-label="Simulation controls">
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
            <span className="sim-controls__progress">{progress}</span>
            <span className="sim-controls__text">{sim.step.status}</span>
          </div>
        </section>

        <section className="diagram-layout" aria-label="System context diagram">
          <div className="diagram-column">
            <ContextDiagram
              selectedId={selectedId}
              highlightedNodeIds={sim.step.highlightedNodeIds}
              highlightedEdgeIds={sim.step.highlightedEdgeIds}
              onSelect={setSelectedId}
              theme={theme}
            />
            <LifecycleSection
              activeStageId={sim.step.activeStageId}
              selectedStageId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
          <DetailPanel selectedId={selectedId} />
        </section>

        <details className="diagram-contents">
          <summary>Diagram contents (text alternative)</summary>
          <ContextList selectedId={selectedId} onSelect={setSelectedId} />
        </details>
      </main>
    </div>
  );
}
