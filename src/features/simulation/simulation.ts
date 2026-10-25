/**
 * Deterministic step-through simulation for the Level 1 context view.
 *
 * The simulation is intentionally small: a fixed, seeded sequence of states
 * that the learner advances with Start/Next and restores with Reset. No
 * network calls, timers, or randomness — every run produces identical steps.
 */

export interface SimulationStep {
  /** Short status line shown in the simulation status strip. */
  status: string;
  /** Plain-language explanation of what just happened. */
  description: string;
  /** Element ids (nodes) highlighted during this step. */
  highlightedNodeIds: string[];
  /** Relationship ids (edges) highlighted during this step. */
  highlightedEdgeIds: string[];
}

export const simulationSteps: SimulationStep[] = [
  {
    status: "Idle — press Start to begin the sample scenario",
    description:
      "The simulation has not started. Select any element in the diagram to learn what it represents.",
    highlightedNodeIds: [],
    highlightedEdgeIds: [],
  },
  {
    status: "Step 1 — Learner selects a scenario",
    description:
      "The Learner picks a bundled sample scenario about an MLOps lifecycle decision. The scenario data ships with the site — nothing is fetched from a real service.",
    highlightedNodeIds: ["learner", "system"],
    highlightedEdgeIds: ["learner-selects"],
  },
  {
    status: "Step 2 — Simulation advances the lifecycle state",
    description:
      "The website applies the Learner's decision to the in-browser scenario state (for example: retraining triggered after simulated drift). Lifecycle stages like data, training, registry, deployment, and monitoring are provider-neutral concepts illustrated with sample data.",
    highlightedNodeIds: ["system"],
    highlightedEdgeIds: [],
  },
  {
    status: "Step 3 — Outcome and explanation shown to the Learner",
    description:
      "The site shows the simulated outcome, the new lifecycle state, and a plain-language explanation of why the decision mattered.",
    highlightedNodeIds: ["system", "learner"],
    highlightedEdgeIds: ["system-explains"],
  },
  {
    status: "Step 4 — Instructor facilitates a walkthrough",
    description:
      "An Instructor can open the same view and walk a group through the scenario. The Instructor sees the same diagram and explanations — there is no separate role-specific interface in this milestone.",
    highlightedNodeIds: ["instructor", "system"],
    highlightedEdgeIds: ["instructor-facilitates"],
  },
];

export interface SimulationState {
  stepIndex: number;
  step: SimulationStep;
  started: boolean;
  finished: boolean;
}

export const initialSimulationState: SimulationState = {
  stepIndex: 0,
  step: simulationSteps[0],
  started: false,
  finished: false,
};

/** Start the simulation: moves from idle to the first active step. */
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
