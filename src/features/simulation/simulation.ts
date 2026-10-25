/**
 * Deterministic step-through simulation of the MLOps lifecycle.
 *
 * Start begins the seeded scenario and Next walks through the eight stages in
 * order; Reset restores the idle state. The sequence is fixed — no timers,
 * randomness, or external calls. When the learner configured an environment
 * during preflight, its labels are woven into relevant stage descriptions.
 */

import { lifecycleStages } from "../lifecycle/lifecycleData";
import { stageDiagrams } from "../containers/containerData";

export type DiagramPlaybackStep = {
  stageId: string;
  nodeId: string;
  nodeName: string;
  explanation: string;
  edgeIds: string[];
};

export function buildDiagramPlaybackSteps(
  stageId?: string,
): DiagramPlaybackStep[] {
  const steps: DiagramPlaybackStep[] = [];
  const stages = [...lifecycleStages].sort((a, b) => a.order - b.order);

  for (const stage of stages) {
    if (stageId !== undefined && stage.id !== stageId) continue;
    const diagram = stageDiagrams.find((entry) => entry.stageId === stage.id);
    if (!diagram) continue;

    const nodes = diagram.nodes.filter((node) => {
      if (!node.id.startsWith("back-stage-") && !node.id.startsWith("fb-")) {
        return true;
      }
      return diagram.edges.some(
        (edge) => edge.target === node.id && edge.kind !== "decision",
      );
    });
    const nodeIds = new Set(nodes.map((node) => node.id));
    const edges = diagram.edges.filter(
      (edge) =>
        edge.kind !== "decision" &&
        nodeIds.has(edge.source) &&
        nodeIds.has(edge.target),
    );
    const positions = new Map(nodes.map((node, index) => [node.id, index]));
    const orderingEdges = edges.filter(
      (edge) =>
        !edges.some(
          (other) =>
            other.source === edge.target && other.target === edge.source,
        ) || positions.get(edge.source)! < positions.get(edge.target)!,
    );
    const remaining = [...nodes];
    const visited = new Set<string>();

    while (remaining.length > 0) {
      const readyIndex = remaining.findIndex((node) =>
        orderingEdges.every(
          (edge) => edge.target !== node.id || visited.has(edge.source),
        ),
      );
      const [node] = remaining.splice(readyIndex < 0 ? 0 : readyIndex, 1);
      steps.push({
        stageId: stage.id,
        nodeId: node.id,
        nodeName: node.name,
        explanation: `Stage ${stage.order} — ${stage.name}: ${node.detail.processing || node.detail.overview}`,
        edgeIds: edges
          .filter((edge) => edge.target === node.id && visited.has(edge.source))
          .map((edge) => edge.id),
      });
      visited.add(node.id);
    }
  }

  return steps;
}

/** Display labels for the configured environment (all provider-neutral). */
export interface SimEnv {
  language: string;
  library: string;
  environment: string;
  compute: string;
}

export interface SimulationStep {
  /** Short status line shown in the simulation status strip. */
  status: string;
  /** Plain-language explanation of what just happened. */
  description: string;
  /** Lifecycle stage id highlighted this step, or null when idle. */
  activeStageId: string | null;
}

const idleStep: SimulationStep = {
  status: "Idle — press Start to begin the sample scenario",
  description: "The simulation has not started.",
  activeStageId: null,
};

export function buildSteps(env?: SimEnv): SimulationStep[] {
  const envNote: Record<number, string> = env
    ? {
        3: ` Preparation runs as a ${env.environment} pipeline written in ${env.language}.`,
        4: ` Experiments run with ${env.library} on ${env.compute} inside the ${env.environment} environment.`,
        7: ` The packaged model is deployed onto the ${env.compute} runtime you configured.`,
      }
    : {};

  const stageSteps = lifecycleStages.map((stage) => ({
    status:
      stage.order === lifecycleStages.length
        ? `${stage.name} — simulation complete`
        : stage.name,
    description:
      (stage.order === 1
        ? `The Learner's scenario reaches "${stage.name}": ${stage.summary}`
        : stage.order === lifecycleStages.length
          ? `"${stage.name}": ${stage.summary} This closes the loop — the lifecycle can feed back into earlier stages. Press Reset to start over.`
          : `The simulation advances to "${stage.name}": ${stage.summary}`) +
      (envNote[stage.order] ?? ""),
    activeStageId: stage.id,
  }));

  return [idleStep, ...stageSteps];
}

export interface SimulationState {
  steps: SimulationStep[];
  stepIndex: number;
  started: boolean;
  finished: boolean;
}

export function createSimulation(env?: SimEnv): SimulationState {
  return {
    steps: buildSteps(env),
    stepIndex: 0,
    started: false,
    finished: false,
  };
}

export function currentStep(state: SimulationState): SimulationStep {
  return state.steps[state.stepIndex];
}

/** Start the simulation: moves from idle to the first stage. */
export function start(state: SimulationState): SimulationState {
  if (state.started) return state;
  return at(state, 1);
}

/** Advance one step. No-op at the end of the sequence. */
export function advance(state: SimulationState): SimulationState {
  if (!state.started || state.finished) return state;
  return at(state, state.stepIndex + 1);
}

function at(state: SimulationState, index: number): SimulationState {
  const clamped = Math.min(index, state.steps.length - 1);
  return {
    ...state,
    stepIndex: clamped,
    started: true,
    finished: clamped === state.steps.length - 1,
  };
}
