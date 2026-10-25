import { useCallback, useEffect, useState } from "react";
import { WorkspaceCanvas } from "./features/canvas/WorkspaceCanvas";
import { DetailPanel } from "./features/context/DetailPanel";
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
      ? "Complete"
      : `Stage ${sim.stepIndex} of ${lifecycleStages.length}`;

  return (
    <div className="app-shell">
      <WorkspaceCanvas
        selectedId={selectedId}
        activeStageId={sim.step.activeStageId}
        activeOrder={sim.started ? sim.stepIndex : 0}
        highlightedNodeIds={sim.step.highlightedNodeIds}
        highlightedEdgeIds={sim.step.highlightedEdgeIds}
        onSelect={setSelectedId}
        theme={theme}
      />

      <header className="hud-header">
        <div className="hud-header__brand">
          <h1>simulation-MLOps</h1>
          <p>Learn the MLOps lifecycle through guided in-browser simulations.</p>
        </div>
        <nav className="level-nav" aria-label="C4 diagram levels">
          {levels.map((l) =>
            l.enabled ? (
              <span key={l.id} className="level-nav__tab level-nav__tab--active" aria-current="page">
                {l.label}
              </span>
            ) : (
              <span
                key={l.id}
                className="level-nav__tab level-nav__tab--planned"
                title="Planned — not available in this milestone"
                aria-disabled="true"
              >
                {l.label}
                <span className="level-nav__badge">planned</span>
              </span>
            ),
          )}
        </nav>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={toggleTheme}
          aria-pressed={theme === "dark"}
        >
          {theme === "light" ? "Dark" : "Light"}
        </button>
      </header>

      <div className="hud-toolbar" role="group" aria-label="Simulation controls">
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
        <span className="hud-toolbar__progress" role="status" aria-live="polite">
          {progress}
        </span>
      </div>

      <DetailPanel selectedId={selectedId} onSelect={setSelectedId} />
    </div>
  );
}
