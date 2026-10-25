/**
 * Deterministic step-through simulation for the Level 1 context view.
 *
 * Start begins the sample scenario and Next walks the Learner through the
 * eight MLOps lifecycle stages in order; Reset restores the idle state.
 * The sequence is fixed — no timers, randomness, or external calls.
 */

import { lifecycleStages } from "../lifecycle/lifecycleData";

export interface SimulationStep {
  /** Short status line shown in the simulation status strip. */
  status: string;
  /** Plain-language explanation of what just happened. */
  description: string;
  /** Lifecycle stage id highlighted this step, or null when idle. */
  activeStageId: string | null;
  /** Context diagram element ids highlighted during this step. */
  highlightedNodeIds: string[];
  highlightedEdgeIds: string[];
}

const idleStep: SimulationStep = {
  status: "Idle — press Start to begin the sample scenario",
  description:
    "The simulation has not started. Select any element in the diagram or a lifecycle stage below to learn what it represents.",
  activeStageId: null,
  highlightedNodeIds: [],
  highlightedEdgeIds: [],
};

const stageSteps: SimulationStep[] = lifecycleStages.map((stage) => ({
  status:
    stage.order === lifecycleStages.length
      ? `${stage.name} — simulation complete`
      : stage.name,
  description:
    stage.order === 1
      ? `The Learner's scenario reaches "${stage.name}": ${stage.summary}`
      : stage.order === lifecycleStages.length
        ? `"${stage.name}": ${stage.summary} This closes the loop — the lifecycle can feed back into earlier stages. Press Reset to start over.`
        : `The simulation advances to "${stage.name}": ${stage.summary}`,
  activeStageId: stage.id,
  highlightedNodeIds: stage.order === 1 ? ["learner", "system"] : ["system"],
  highlightedEdgeIds:
    stage.order === 1 ? ["learner-selects"] : ["system-explains"],
}));

export const simulationSteps: SimulationStep[] = [idleStep, ...stageSteps];

export interface SimulationState {
  stepIndex: number;
  step: SimulationStep;
  started: boolean;
  finished: boolean;
}

export const initialSimulationState: SimulationState = {
  stepIndex: 0,
  step: idleStep,
  started: false,
  finished: false,
};

/** Start the simulation: moves from idle to the first stage. */
export function start(state: SimulationState): SimulationState {
  if (state.started) return state;
  return at(1);
}

/** Advance one step. No-op at the end of the sequence. */
export function advance(state: SimulationState): SimulationState {
  if (!state.started || state.finished) return state;
  return at(state.stepIndex + 1);
}

/** Restore the initial state. */
export function reset(): SimulationState {
  return initialSimulationState;
}

function at(index: number): SimulationState {
  const clamped = Math.min(index, simulationSteps.length - 1);
  return {
    stepIndex: clamped,
    step: simulationSteps[clamped],
    started: true,
    finished: clamped === simulationSteps.length - 1,
  };
}
