import { useCallback, useEffect, useState } from "react";
import { WorkspaceCanvas } from "./features/canvas/WorkspaceCanvas";
import { lifecycleStages } from "./features/lifecycle/lifecycleData";
import {
  initialSimulationState,
  start,
  advance,
  reset,
  type SimulationState,
} from "./features/simulation/simulation";

type Theme = "light" | "dark";

export default function App() {
  const [theme, setTheme] = useState<Theme>("light");
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
    setSelectedId(null);
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
        finished={sim.finished}
        onSelect={setSelectedId}
        theme={theme}
      />

      <header className="hud-header hud-header--compact">
        <div className="hud-header__brand">
          <h1>simulation-MLOps</h1>
        </div>
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
    </div>
  );
}
