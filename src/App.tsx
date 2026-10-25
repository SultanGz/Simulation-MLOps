import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getStageDiagram } from "./features/containers/containerData";
import { WorkspaceCanvas } from "./features/canvas/WorkspaceCanvas";
import { Level2Canvas } from "./features/containers/Level2Canvas";
import { lifecycleStages } from "./features/lifecycle/lifecycleData";
import {
  createSimulation,
  currentStep,
  buildDiagramPlaybackSteps,
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
  PreflightFlowNode,
} from "./features/preflight/PreflightPanelNode";

type Theme = "light" | "dark";
type Phase = "welcome" | "setup" | "validate" | "sim";
type Level = "l1" | "l2";
type PlaybackSession = {
  index: number;
  status: "idle" | "running" | "paused" | "completed";
};
const idlePlayback: PlaybackSession = { index: -1, status: "idle" };
const playbackInterval = 3200;

const references = [
  {
    label: "MLOps pipelines and validation",
    url: "https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning",
  },
  {
    label: "Preventing data leakage",
    url: "https://scikit-learn.org/stable/common_pitfalls.html",
  },
  {
    label: "PyTorch compute options",
    url: "https://docs.pytorch.org/get-started/locally/",
  },
  {
    label: "XGBoost for R",
    url: "https://xgboost.readthedocs.io/en/stable/R-package/",
  },
  {
    label: "Understanding C4 diagrams",
    url: "https://c4model.com/diagrams/system-context",
  },
];

export default function App() {
  const [theme, setTheme] = useState<Theme>("light");
  const [phase, setPhase] = useState<Phase>("welcome");
  const [config, setConfig] = useState<EnvConfig>(presetConfig);
  const [checks, setChecks] = useState<DisplayedCheck[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [level, setLevel] = useState<Level>("l1");
  const [level2Overview, setLevel2Overview] = useState(false);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(
    null,
  );
  const [simTemplate, setSimTemplate] = useState<SimulationState>(() =>
    createSimulation(),
  );
  const [sessions, setSessions] = useState<Record<string, PlaybackSession>>({});
  const lifecyclePlayback = sessions.l1 ?? idlePlayback;
  const sim = useMemo<SimulationState>(
    () => ({
      ...simTemplate,
      stepIndex: lifecyclePlayback.index + 1,
      started: lifecyclePlayback.index >= 0,
      finished: lifecyclePlayback.status === "completed",
    }),
    [simTemplate, lifecyclePlayback],
  );
  const pausePlayback = useCallback(() => {
    setSessions((previous) => {
      if (
        !Object.values(previous).some((session) => session.status === "running")
      )
        return previous;
      return Object.fromEntries(
        Object.entries(previous).map(([key, session]) => [
          key,
          session.status === "running"
            ? { ...session, status: "paused" as const }
            : session,
        ]),
      );
    });
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const timers = useRef<number[]>([]);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /* ----- preflight actions ----- */

  const runValidation = useCallback((cfg: EnvConfig) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const results = evaluateChecks(cfg);
    setChecks(
      results.map((result) => ({
        id: result.id,
        label: result.label,
        status: "pending",
      })),
    );
    setPhase("validate");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setChecks(results);
      return;
    }
    results.forEach((result, index) => {
      timers.current.push(
        window.setTimeout(
          () =>
            setChecks((previous) =>
              previous.map((check) =>
                check.id === result.id
                  ? { ...check, status: "running" }
                  : check,
              ),
            ),
          index * 600,
        ),
      );
      timers.current.push(
        window.setTimeout(
          () =>
            setChecks((previous) =>
              previous.map((check) =>
                check.id === result.id ? result : check,
              ),
            ),
          index * 600 + 450,
        ),
      );
    });
  }, []);

  const actions: PreflightActions = useMemo(
    () => ({
      onSetup: () => setPhase("setup"),
      onPick: (key, id) =>
        setConfig((previous) => ({ ...previous, [key]: id })),
      onPreset: () => setConfig(presetConfig),
      onValidate: () => runValidation(config),
      onBackToSetup: () => {
        timers.current.forEach(clearTimeout);
        setPhase("setup");
      },
      onApplyFix: (next) => {
        setConfig(next);
        runValidation(next);
      },
      onResetSetup: () => setConfig(presetConfig),
      onDismissHelp: () => setHelpOpen(false),
      onStart: () => {
        if (!evaluateChecks(config).every((check) => check.status === "passed"))
          return;
        const env = {
          language: optionLabel("language", config.language),
          library: optionLabel("library", config.library),
          environment: optionLabel("environment", config.environment),
          compute: optionLabel("compute", config.compute),
        };
        setPhase("sim");
        setLevel("l1");
        setLevel2Overview(false);
        setSelectedContainerId(null);
        setDetailsOpen(false);
        setMenuOpen(false);
        setSimTemplate(createSimulation(env));
        setSessions({});
        setSelectedId(null);
      },
    }),
    [config, runValidation],
  );

  /* ----- simulation sync ----- */

  // Keep the inspected stage in sync with simulation progress.
  useEffect(() => {
    const step = currentStep(sim);
    if (step.activeStageId) setSelectedId(step.activeStageId);
  }, [sim.stepIndex, simTemplate]);

  /* ----- level + stage navigation ----- */

  const currentStage =
    lifecycleStages.find((stage) => stage.id === selectedId) ??
    lifecycleStages[Math.max(0, sim.stepIndex - 1)];
  const pickStage = useCallback(
    (id: string | null) => {
      pausePlayback();
      setSelectedId(id);
      setSelectedContainerId(null);
      setDetailsOpen(Boolean(id) && level === "l1");
      if (id) setLevel2Overview(false);
      setMenuOpen(false);
    },
    [level, pausePlayback],
  );
  const goStage = (delta: number) => {
    const next = Math.min(
      Math.max(currentStage.order - 1 + delta, 0),
      lifecycleStages.length - 1,
    );
    pickStage(lifecycleStages[next].id);
  };
  const exploreStage = useCallback(
    (id: string) => {
      pausePlayback();
      setSelectedId(id);
      setSelectedContainerId(null);
      setLevel("l2");
      setLevel2Overview(false);
      setDetailsOpen(false);
      setMenuOpen(false);
    },
    [pausePlayback],
  );
  const showAllServices = () => {
    pausePlayback();
    setLevel("l2");
    setLevel2Overview(true);
    setSelectedContainerId(null);
    setDetailsOpen(false);
    setMenuOpen(false);
    setHelpOpen(false);
  };
  const overview = () => {
    pausePlayback();
    setLevel("l1");
    setLevel2Overview(false);
    setSelectedId(null);
    setSelectedContainerId(null);
    setDetailsOpen(false);
    setHelpOpen(false);
    setMenuOpen(false);
  };
  const diagram = getStageDiagram(currentStage.id);
  const scope =
    level === "l1" ? "l1" : level2Overview ? "l2:all" : `l2:${currentStage.id}`;
  const playback = sessions[scope] ?? idlePlayback;
  const diagramSteps = useMemo(
    () =>
      level === "l2"
        ? buildDiagramPlaybackSteps(
            level2Overview ? undefined : currentStage.id,
          )
        : [],
    [level, level2Overview, currentStage.id],
  );
  const stepCount =
    level === "l1" ? lifecycleStages.length : diagramSteps.length;
  const activeDiagramStep =
    level === "l2" && playback.index >= 0 ? diagramSteps[playback.index] : null;
  const completedDiagramSteps = useMemo(
    () =>
      diagramSteps.slice(
        0,
        playback.status === "completed"
          ? playback.index + 1
          : Math.max(0, playback.index),
      ),
    [diagramSteps, playback.index, playback.status],
  );
  const progress =
    playback.index < 0 ? "Not started" : `${playback.index + 1} / ${stepCount}`;
  const stageStatus =
    playback.status === "idle"
      ? "Ready"
      : playback.status === "running"
        ? "Running"
        : playback.status === "paused"
          ? "Paused"
          : "Completed";
  const playLabel =
    playback.status === "running"
      ? "Pause simulation"
      : playback.status === "paused"
        ? "Resume simulation"
        : playback.status === "completed"
          ? "Restart simulation"
          : "Start simulation";
  const playbackOrder = activeDiagramStep
    ? (lifecycleStages.find((stage) => stage.id === activeDiagramStep.stageId)
        ?.order ?? 0)
    : sim.started
      ? sim.stepIndex
      : 0;

  useEffect(() => {
    pausePlayback();
  }, [scope, phase, helpOpen, pausePlayback]);

  useEffect(() => {
    if (phase !== "sim" || helpOpen || playback.status !== "running") return;
    const timer = window.setTimeout(() => {
      setSessions((previous) => {
        const session = previous[scope];
        if (!session || session.status !== "running") return previous;
        return {
          ...previous,
          [scope]:
            session.index + 1 >= stepCount
              ? { ...session, status: "completed" }
              : { ...session, index: session.index + 1 },
        };
      });
    }, playbackInterval);
    return () => window.clearTimeout(timer);
  }, [scope, phase, helpOpen, playback.status, playback.index, stepCount]);

  useEffect(() => {
    if (playback.status !== "running") return;
    if (level === "l1") {
      setSelectedId(lifecycleStages[playback.index]?.id ?? null);
      setSelectedContainerId(null);
      setDetailsOpen(true);
    } else if (activeDiagramStep) {
      setSelectedId(activeDiagramStep.stageId);
      setSelectedContainerId(level2Overview ? null : activeDiagramStep.nodeId);
      setDetailsOpen(!level2Overview);
    }
  }, [
    scope,
    playback.index,
    playback.status,
    level,
    level2Overview,
    activeDiagramStep,
  ]);

  const togglePlayback = () => {
    setMenuOpen(false);
    setSessions((previous) => {
      const session = previous[scope] ?? idlePlayback;
      return {
        ...previous,
        [scope]:
          session.status === "running"
            ? { ...session, status: "paused" }
            : {
                index:
                  session.status === "completed" || session.index < 0
                    ? 0
                    : session.index,
                status: "running",
              },
      };
    });
  };
  const onReset = () => {
    setSessions((previous) => ({ ...previous, [scope]: idlePlayback }));
    setSelectedContainerId(null);
    setDetailsOpen(false);
    setMenuOpen(false);
  };
  const scene = helpOpen ? "help" : phase === "sim" ? null : phase;
  const preflightNode: PreflightFlowNode | undefined = scene
    ? {
        id: "preflight-panel",
        type: "preflightPanel",
        position: { x: -2400, y: 60 },
        data: { scene, config, checks, actions, references },
        draggable: false,
        selectable: false,
        zIndex: 30,
      }
    : undefined;

  return (
    <main
      className="app-shell immersive-dashboard"
      aria-label="MLOps interactive dashboard"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setMenuOpen(false);
          setHelpOpen(false);
          menuButton.current?.focus();
        }
      }}
    >
      <h1 className="sr-only">MLOps lab · Interactive lifecycle dashboard</h1>
      <a className="skip-link" href="#dashboard-tools">
        Skip to dashboard tools
      </a>
      {level === "l1" || scene ? (
        <WorkspaceCanvas
          selectedId={
            phase === "sim" && !scene && detailsOpen ? selectedId : null
          }
          activeOrder={sim.started ? sim.stepIndex : 0}
          finished={sim.finished}
          playbackRunning={level === "l1" && playback.status === "running"}
          preflightNode={preflightNode}
          focusId={scene ? "preflight-panel" : null}
          showLifecycle={phase === "sim" && !scene}
          showDetails={detailsOpen && !scene}
          onSelect={pickStage}
          onExploreStage={exploreStage}
          theme={theme}
        />
      ) : (
        <Level2Canvas
          stageId={currentStage.id}
          overview={level2Overview}
          activeOrder={playbackOrder}
          finished={playback.status === "completed"}
          playbackStep={
            playback.status === "completed" ? null : activeDiagramStep
          }
          completedPlaybackSteps={completedDiagramSteps}
          playbackRunning={playback.status === "running"}
          onStageSelect={exploreStage}
          selectedContainerId={selectedContainerId}
          showDetails={detailsOpen}
          onSelect={(id) => {
            pausePlayback();
            setSelectedContainerId(id);
            setDetailsOpen(Boolean(id));
            setMenuOpen(false);
          }}
          theme={theme}
        />
      )}
      <div
        id="dashboard-tools"
        className="dashboard-tools"
        role="region"
        aria-label="Dashboard tools"
      >
        <div className="dashboard-tool-row">
          <button
            className="dashboard-home"
            onClick={phase === "sim" ? overview : () => setHelpOpen(false)}
            aria-label="MLOps lab overview"
          >
            <span className="brand-mark" aria-hidden="true">
              M
            </span>
            <span>MLOps lab</span>
          </button>

          <button
            ref={menuButton}
            className="btn btn--ghost dashboard-menu-button"
            aria-label="Dashboard menu"
            aria-expanded={menuOpen}
            aria-controls="dashboard-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            •••
          </button>
        </div>
        {menuOpen && (
          <div id="dashboard-menu" className="dashboard-menu">
            <p className="eyebrow">Settings & help</p>
            {phase === "sim" && (
              <>
                {level === "l2" && !level2Overview && (
                  <label>
                    Inspect a service
                    <select
                      value={selectedContainerId ?? ""}
                      onChange={(event) => {
                        pausePlayback();
                        const id = event.target.value || null;
                        setSelectedContainerId(id);
                        setDetailsOpen(Boolean(id));
                        setMenuOpen(false);
                      }}
                    >
                      <option value="">Select a service</option>
                      {diagram?.nodes.map((node) => (
                        <option key={node.id} value={node.id}>
                          {node.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <p className="dashboard-menu-status">
                  {level === "l1"
                    ? "Level 1 lifecycle"
                    : "Level 2 service flow"}
                  : {stageStatus} · {progress}. Navigation pauses playback.
                </p>
              </>
            )}
            <div className="dashboard-menu-actions">
              <button
                className="btn btn--ghost"
                aria-pressed={theme === "dark"}
                onClick={() =>
                  setTheme((previous) =>
                    previous === "light" ? "dark" : "light",
                  )
                }
              >
                {theme === "light" ? "Dark theme" : "Light theme"}
              </button>
              <button
                className="btn btn--ghost"
                onClick={() => {
                  setHelpOpen(true);
                  setMenuOpen(false);
                }}
              >
                Help & sources
              </button>
            </div>
            {phase === "sim" && (
              <div className="dashboard-menu-actions">
                <button
                  className="btn btn--ghost"
                  onClick={() => {
                    setHelpOpen(false);
                    setMenuOpen(false);
                    setPhase("setup");
                  }}
                >
                  Edit environment
                </button>
                <button className="btn btn--ghost" onClick={onReset}>
                  Reset progress
                </button>
              </div>
            )}
            <p className="quiet">
              Simulated only · No real training or deployment.
            </p>
          </div>
        )}
      </div>
      {phase === "sim" && !scene && (
        <section
          className="dashboard-transport"
          aria-label="Walkthrough control panel"
        >
          <div className="transport-context">
            <div className="transport-stage">
              <span className="eyebrow">
                Stage {currentStage.order} of 8
                {level2Overview ? " · All stages overview" : ""}
              </span>
              <strong>{currentStage.name}</strong>
              <span className="transport-status" role="status">
                {stageStatus} · {level === "l1" ? "Stage" : "Step"} {progress}
              </span>
            </div>
            <label className="transport-level">
              <span className="sr-only">Current level</span>
              <select
                aria-label="Current level"
                value={level === "l1" ? "l1" : level2Overview ? "l2-all" : "l2"}
                onChange={(event) => {
                  pausePlayback();
                  if (event.target.value === "l1") {
                    setLevel("l1");
                    setLevel2Overview(false);
                    setSelectedContainerId(null);
                    setDetailsOpen(false);
                  } else if (event.target.value === "l2-all") showAllServices();
                  else exploreStage(currentStage.id);
                }}
              >
                <option value="l1">Level 1 · Lifecycle</option>
                <option value="l2">Level 2 · Current stage</option>
                <option value="l2-all">Level 2 · All stages</option>
              </select>
            </label>
          </div>
          {activeDiagramStep && (
            <p className="transport-activity">{activeDiagramStep.nodeName}</p>
          )}
          <div className="transport-buttons">
            <button
              className="btn btn--ghost transport-arrow"
              aria-label="Previous stage"
              disabled={currentStage.order === 1}
              onClick={() => goStage(-1)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="m14 6-6 6 6 6" />
              </svg>
            </button>
            <button
              className="btn transport-play"
              aria-label={playLabel}
              title={playLabel}
              onClick={togglePlayback}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                {playback.status === "running" ? (
                  <>
                    <rect x="6" y="5" width="4" height="14" />
                    <rect x="14" y="5" width="4" height="14" />
                  </>
                ) : (
                  <path d="M8 5v14l11-7z" />
                )}
              </svg>
            </button>
            <button
              className="btn btn--ghost transport-arrow"
              aria-label="Next stage"
              disabled={currentStage.order === 8}
              onClick={() => goStage(1)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="m10 6 6 6-6 6" />
              </svg>
            </button>
          </div>
        </section>
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {phase === "sim"
          ? `${stageStatus}. ${level === "l1" ? "Level 1 lifecycle" : "Level 2 services"} ${progress}. Viewing ${currentStage.name}. ${activeDiagramStep?.explanation ?? (sim.started ? currentStep(sim).description : "Press Start to run the simulation.")}`
          : `${phase} scene`}
      </span>
    </main>
  );
}
