import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Node } from "@xyflow/react";
import { WorkspaceCanvas } from "./features/canvas/WorkspaceCanvas";
import { lifecycleStages } from "./features/lifecycle/lifecycleData";
import {
  createSimulation,
  currentStep,
  start,
  advance,
  type SimulationState,
} from "./features/simulation/simulation";
import {
  presetConfig,
  evaluateChecks,
  optionLabel,
  type EnvConfig,
} from "./features/preflight/preflightData";
import type {
  PreflightActions,
  DisplayedCheck,
} from "./features/preflight/PreflightPanelNode";

type Theme = "light" | "dark";
type Phase = "welcome" | "setup" | "validate" | "sim";

const phases = [
  { id: "welcome", label: "Welcome" },
  { id: "setup", label: "Set up" },
  { id: "validate", label: "Validate" },
  { id: "sim", label: "Simulate" },
] as const;

const PREFLIGHT_NODE_ID = "preflight-panel";

export default function App() {
  const [theme, setTheme] = useState<Theme>("light");
  const [phase, setPhase] = useState<Phase>("welcome");
  const [config, setConfig] = useState<EnvConfig>(presetConfig);
  const [checks, setChecks] = useState<DisplayedCheck[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>("define-problem");
  const [sim, setSim] = useState<SimulationState>(() => createSimulation());
  const timers = useRef<number[]>([]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const reducedMotion = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  /* ----- preflight actions ----- */

  const runValidation = useCallback(
    (cfg: EnvConfig) => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      const results = evaluateChecks(cfg);
      const pending: DisplayedCheck[] = results.map((r) => ({
        id: r.id,
        label: r.label,
        status: "pending",
      }));
      setChecks(pending);
      setPhase("validate");

      if (reducedMotion) {
        setChecks(results);
        return;
      }
      results.forEach((r, i) => {
        timers.current.push(
          window.setTimeout(
            () =>
              setChecks((cs) =>
                cs.map((c) => (c.id === r.id ? { ...c, status: "running" } : c)),
              ),
            i * 600,
          ),
        );
        timers.current.push(
          window.setTimeout(
            () =>
              setChecks((cs) => cs.map((c) => (c.id === r.id ? r : c))),
            i * 600 + 450,
          ),
        );
      });
    },
    [reducedMotion],
  );

  const actions: PreflightActions = useMemo(
    () => ({
      onSetup: () => setPhase("setup"),
      onPick: (key, id) => setConfig((c) => ({ ...c, [key]: id })),
      onPreset: () => setConfig(presetConfig),
      onValidate: () => runValidation(config),
      onBackToSetup: () => setPhase("setup"),
      onApplyFix: (cfg) => {
        setConfig(cfg);
        runValidation(cfg);
      },
      onResetSetup: () => setConfig(presetConfig),
      onStart: () => {
        const env = {
          language: optionLabel("language", config.language),
          library: optionLabel("library", config.library),
          environment: optionLabel("environment", config.environment),
          compute: optionLabel("compute", config.compute),
        };
        setPhase("sim");
        setSim(start(createSimulation(env)));
        setSelectedId("define-problem");
      },
    }),
    [config, runValidation],
  );

  /* ----- simulation sync ----- */

  // Keep the inspected stage in sync with simulation progress.
  useEffect(() => {
    const step = currentStep(sim);
    if (step.activeStageId) setSelectedId(step.activeStageId);
  }, [sim]);

  const onNext = useCallback(() => setSim((s) => advance(s)), []);
  const onReset = useCallback(() => {
    setSim((s) => ({ ...s, stepIndex: 0, started: false, finished: false }));
    setSelectedId("define-problem");
  }, []);
  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "light" ? "dark" : "light")),
    [],
  );

  const progress = !sim.started
    ? "Not started"
    : sim.finished
      ? "Complete"
      : `Stage ${sim.stepIndex} of ${lifecycleStages.length}`;

  const preflightNode: Node | undefined =
    phase === "sim"
      ? undefined
      : {
          id: PREFLIGHT_NODE_ID,
          type: "preflightPanel",
          position: { x: -2400, y: 60 },
          data: { scene: phase, config, checks, actions },
          draggable: false,
          zIndex: 30,
        };

  return (
    <div className="app-shell">
      <WorkspaceCanvas
        selectedId={selectedId}
        activeOrder={phase === "sim" && sim.started ? sim.stepIndex : 0}
        finished={phase === "sim" && sim.finished}
        preflightNode={preflightNode}
        focusId={phase === "sim" ? null : PREFLIGHT_NODE_ID}
        onSelect={setSelectedId}
        theme={theme}
      />

      <header className="hud-header hud-header--compact">
        <div className="hud-header__brand">
          <h1>simulation-MLOps</h1>
        </div>
        <ol className="preflight-steps" aria-label="Progress">
          {phases.map((p) => (
            <li
              key={p.id}
              className={`preflight-steps__item${p.id === phase ? " preflight-steps__item--current" : ""}`}
              aria-current={p.id === phase ? "step" : undefined}
            >
              {p.label}
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={toggleTheme}
          aria-pressed={theme === "dark"}
        >
          {theme === "light" ? "Dark" : "Light"}
        </button>
      </header>

      {phase === "sim" && (
        <div className="hud-toolbar" role="group" aria-label="Simulation controls">
          <button
            type="button"
            className="btn"
            onClick={onNext}
            disabled={!sim.started || sim.finished}
          >
            Next
          </button>
          <button type="button" className="btn btn--ghost" onClick={onReset}>
            Reset simulation
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setPhase("setup")}
          >
            Back to setup
          </button>
          <span className="hud-toolbar__progress" role="status" aria-live="polite">
            {progress}
          </span>
        </div>
      )}
    </div>
  );
}
