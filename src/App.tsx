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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [sim, setSim] = useState<SimulationState>(initialSimulationState);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "light" ? "dark" : "light")),
    [],
  );
  const onStart = useCallback(() => setSim(start), []);
  const onNext = useCallback(() => setSim((s) => advance(s)), []);
  const onReset = useCallback(() => {
    setSim(reset());
    setSelectedStageId(null);
  }, []);

  const activeStage = sim.step.activeStageId
    ? lifecycleStages.find((s) => s.id === sim.step.activeStageId)
    : undefined;
  const shownStage =
    selectedStageId != null
      ? lifecycleStages.find((s) => s.id === selectedStageId)
      : activeStage;

  return (
    <div className="app">
      <header className="site-header">
        <div className="site-header__row">
          <div>
            <h1 className="site-header__title">simulation-MLOps</h1>
            <p className="site-header__purpose">
              Learn the MLOps lifecycle by stepping through guided, in-browser
              simulations — no accounts, no external services.
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
            {shownStage && (
              <p className="sim-controls__stage-io">
                <span>
                  <strong>Input:</strong> {shownStage.input}
                </span>
                <span>
                  <strong>Output:</strong> {shownStage.output}
                </span>
              </p>
            )}
          </div>
        </section>

        <section className="diagram-layout" aria-label="System context diagram">
          <ContextDiagram
            selectedId={selectedId}
            highlightedNodeIds={sim.step.highlightedNodeIds}
            highlightedEdgeIds={sim.step.highlightedEdgeIds}
            onSelect={setSelectedId}
            theme={theme}
          />
          <DetailPanel selectedId={selectedId} />
        </section>

        <LifecycleSection
          activeStageId={sim.step.activeStageId}
          selectedStageId={selectedStageId}
          onSelect={setSelectedStageId}
        />

        <ContextList selectedId={selectedId} onSelect={setSelectedId} />
      </main>
    </div>
  );
}
