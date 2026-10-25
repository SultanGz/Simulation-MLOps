/**
 * Deterministic step-through simulation of the MLOps lifecycle.
 *
 * Start begins the seeded scenario and Next walks through the eight stages in
 * order; Reset restores the idle state. The sequence is fixed — no timers,
 * randomness, or external calls. When the learner configured an environment
 * during preflight, its labels are woven into relevant stage descriptions.
 */

import { lifecycleStages } from "../lifecycle/lifecycleData";

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
  return { steps: buildSteps(env), stepIndex: 0, started: false, finished: false };
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
