/**
 * Level 2 (container view) data — provider-neutral, simulated services only.
 *
 * "Container" here means an application, service, or data store — never a
 * Docker container. Each stage gets a small diagram: incoming artifacts,
 * processing services, stores, decision branches, and the handoff onward.
 */

import type { StageIO } from "../lifecycle/lifecycleData";

export type ContainerKind = "service" | "store" | "external" | "handoff";
export type EdgeKind = "flow" | "decision" | "handoff";

export interface ContainerDetail {
  overview: string;
  inputs: StageIO[];
  processing: string;
  outputs: StageIO[];
}

export interface ContainerNodeData {
  id: string;
  kind: ContainerKind;
  name: string;
  /** One-line responsibility shown inside the node. */
  responsibility: string;
  x: number;
  y: number;
  detail: ContainerDetail;
}

export interface ContainerEdgeData {
  id: string;
  source: string;
  target: string;
  label: string;
  kind: EdgeKind;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface StageDiagram {
  stageId: string;
  nodes: ContainerNodeData[];
  edges: ContainerEdgeData[];
}

/* ---------------------------------------------------------------- helpers */

const io = (name: string, note: string): StageIO => ({ name, note });

/* --------------------------------------------------------- stage diagrams */

export const stageDiagrams: StageDiagram[] = [
  /* 1 — Define the problem */
  {
    stageId: "define-problem",
    nodes: [
      {
        id: "intake", kind: "external", x: 0, y: 120,
        name: "Request intake", responsibility: "Incoming needs and constraints",
        detail: {
          overview: "Collects the user or business need and its constraints.",
          inputs: [io("Business need", "The problem or decision to support"), io("Constraints", "Latency, cost, fairness limits")],
          processing: "Registers the request, tags stakeholders, and opens a tracked task.",
          outputs: [io("Intake record", "Passed to the definition workflow")],
        },
      },
      {
        id: "define-workflow", kind: "service", x: 300, y: 120,
        name: "Problem definition", responsibility: "Frames need as an ML task",
        detail: {
          overview: "Turns the intake record into a measurable ML task.",
          inputs: [io("Intake record", "From request intake")],
          processing: "Drafts the task, chooses success measures, and sets acceptance thresholds. Unclear points loop back to intake for clarification.",
          outputs: [io("Task specification", "Versioned into the spec store")],
        },
      },
      {
        id: "spec-store", kind: "store", x: 600, y: 120,
        name: "Spec store", responsibility: "Versioned task specifications",
        detail: {
          overview: "Keeps every approved task specification with its history.",
          inputs: [io("Task specification", "From problem definition")],
          processing: "Versions, indexes, and exposes the current spec to downstream stages.",
          outputs: [io("Approved spec", "Handed to Acquire and understand data")],
        },
      },
      {
        id: "to-stage-2", kind: "handoff", x: 900, y: 120,
        name: "→ Stage 2", responsibility: "Acquire and understand data",
        detail: {
          overview: "Handoff: the versioned spec defines what data to find.",
          inputs: [io("Approved spec", "From the spec store")],
          processing: "Opens data acquisition with the task and success criteria attached.",
          outputs: [io("Data requirements", "Used to choose sources")],
        },
      },
    ],
    edges: [
      { id: "e1", source: "intake", target: "define-workflow", label: "need + constraints", kind: "flow" },
      { id: "e2", source: "define-workflow", target: "spec-store", label: "task specification", kind: "flow" },
      { id: "e3", source: "spec-store", target: "to-stage-2", label: "approved spec", kind: "handoff" },
      { id: "e4", source: "define-workflow", target: "intake", label: "clarify (unclear)", kind: "decision", sourceHandle: "s-bottom", targetHandle: "t-bottom" },
    ],
  },

  /* 2 — Acquire and understand data */
  {
    stageId: "acquire-data",
    nodes: [
      {
        id: "from-stage-1", kind: "handoff", x: 0, y: -60,
        name: "← Stage 1", responsibility: "Task specification arrives",
        detail: {
          overview: "Incoming handoff: the versioned task specification.",
          inputs: [io("Approved spec", "From the spec store")],
          processing: "Attaches the task and success criteria to this stage.",
          outputs: [io("Data requirements", "Drives source selection")],
        },
      },
      {
        id: "connectors", kind: "service", x: 0, y: 120,
        name: "Source connectors", responsibility: "Reads candidate data sources",
        detail: {
          overview: "Uniform readers for files, tables, and streams — simulated samples only.",
          inputs: [io("Data requirements", "From the task spec")],
          processing: "Discovers candidate sources and opens read sessions.",
          outputs: [io("Candidate sources", "Sent to governance checks")],
        },
      },
      {
        id: "governance", kind: "service", x: 300, y: 120,
        name: "Access & governance", responsibility: "Permissions and policy checks",
        detail: {
          overview: "Decides which sources may be used under access rules.",
          inputs: [io("Candidate sources", "From connectors"), io("Access rules", "Permissions, privacy, licensing")],
          processing: "Evaluates each source against the rules and marks permitted data.",
          outputs: [io("Permitted data", "Landed in the raw store")],
        },
      },
      {
        id: "raw-store", kind: "store", x: 600, y: 120,
        name: "Raw data store", responsibility: "Immutable landed data",
        detail: {
          overview: "Keeps acquired data exactly as received for lineage.",
          inputs: [io("Permitted data", "From governance")],
          processing: "Stores snapshots with acquisition metadata.",
          outputs: [io("Raw dataset", "Profiled by the quality service")],
        },
      },
      {
        id: "profiling", kind: "service", x: 900, y: 120,
        name: "Profiling & quality", responsibility: "Assesses fit for the task",
        detail: {
          overview: "Profiles distributions and checks data quality.",
          inputs: [io("Raw dataset", "From the raw store"), io("Success measures", "From the spec")],
          processing: "Computes profiles, flags missing values, imbalance, and drift; then issues a suitability decision.",
          outputs: [io("Quality findings", "Catalogued for review"), io("Suitability decision", "Go/no-go for preparation")],
        },
      },
      {
        id: "catalog", kind: "store", x: 600, y: 300,
        name: "Metadata catalog", responsibility: "Profiles, lineage, findings",
        detail: {
          overview: "Indexes datasets, profiles, and quality findings.",
          inputs: [io("Quality findings", "From profiling")],
          processing: "Records dataset versions and their assessments.",
          outputs: [io("Catalog entry", "Searchable lineage for later stages")],
        },
      },
      {
        id: "to-stage-3", kind: "handoff", x: 900, y: 300,
        name: "→ Stage 3", responsibility: "Prepare data and features",
        detail: {
          overview: "Handoff when data is judged suitable.",
          inputs: [io("Suitability decision", "From profiling")],
          processing: "Passes the profiled dataset and its findings forward.",
          outputs: [io("Selected dataset", "Input to preparation")],
        },
      },
      {
        id: "back-stage-1", kind: "handoff", x: 0, y: 300,
        name: "↩ Stage 1", responsibility: "Redefine problem (unsuitable)",
        detail: {
          overview: "When no suitable data exists, the problem is redefined.",
          inputs: [io("Suitability decision", "From profiling")],
          processing: "Returns a 'no suitable data' outcome so the task can be narrowed or re-scoped.",
          outputs: [io("Redefinition trigger", "Reopens Define the problem")],
        },
      },
    ],
    edges: [
      { id: "e0", source: "from-stage-1", target: "connectors", label: "data requirements", kind: "handoff", sourceHandle: "s-bottom", targetHandle: "t-top" },
      { id: "e1", source: "connectors", target: "governance", label: "candidate sources", kind: "flow" },
      { id: "e2", source: "governance", target: "raw-store", label: "permitted data", kind: "flow" },
      { id: "e3", source: "raw-store", target: "profiling", label: "raw dataset", kind: "flow" },
      { id: "e4", source: "profiling", target: "catalog", label: "profile + findings", kind: "flow", sourceHandle: "s-bottom", targetHandle: "t-right" },
      { id: "e5", source: "profiling", target: "to-stage-3", label: "pass: suitable data + findings", kind: "handoff", sourceHandle: "s-bottom", targetHandle: "t-top" },
      { id: "e6", source: "profiling", target: "back-stage-1", label: "reject: redefine problem", kind: "decision", sourceHandle: "s-bottom", targetHandle: "t-right" },
      { id: "e7", source: "profiling", target: "connectors", label: "improve: reselect sources", kind: "decision", sourceHandle: "s-top", targetHandle: "t-top" },
      { id: "e8", source: "from-stage-1", target: "profiling", label: "success criteria", kind: "handoff", sourceHandle: "s-right", targetHandle: "t-top" },
    ],
  },

  /* 3 — Prepare data and features */
  {
    stageId: "prepare-data",
    nodes: [
      {
        id: "from-stage-2", kind: "handoff", x: 0, y: -60,
        name: "← Stage 2", responsibility: "Selected dataset arrives",
        detail: {
          overview: "Incoming handoff: the profiled, suitable dataset.",
          inputs: [io("Selected dataset", "From acquisition"), io("Quality findings", "From the catalog")],
          processing: "Attaches data and requirements to this stage.",
          outputs: [io("Selected dataset", "Input to the pipeline")],
        },
      },
      {
        id: "pipeline", kind: "service", x: 0, y: 120,
        name: "Transformation pipeline", responsibility: "Cleans and transforms",
        detail: {
          overview: "Repeatable pipeline that cleans and reshapes selected data.",
          inputs: [io("Selected dataset", "From acquisition"), io("Preparation rules", "Cleaning and shaping steps")],
          processing: "Creates train/evaluation splits before fitting learned preprocessing. Fits imputers, scalers, and encoders on training data only; transforms evaluation data with the fitted steps.",
          outputs: [io("Transformed data", "Sent to validation checks")],
        },
      },
      {
        id: "validation", kind: "service", x: 300, y: 120,
        name: "Validation checks", responsibility: "Enforces quality requirements",
        detail: {
          overview: "Gates transformed data against quality requirements.",
          inputs: [io("Transformed data", "From the pipeline"), io("Quality requirements", "From the spec")],
          processing: "Runs schema, completeness, and leakage checks; failures route back for fixing or re-acquisition.",
          outputs: [io("Checked data", "Passed to feature computation"), io("Check report", "Logged with the run")],
        },
      },
      {
        id: "features", kind: "service", x: 600, y: 120,
        name: "Feature computation", responsibility: "Builds training-ready features",
        detail: {
          overview: "Computes the final feature set used for training.",
          inputs: [io("Checked data", "From validation")],
          processing: "Derives features within the existing splits, fits any learned feature steps on training data only, and transforms evaluation data without refitting. Records split lineage and fitted steps.",
          outputs: [io("Feature set", "Versioned into the store")],
        },
      },
      {
        id: "feature-store", kind: "store", x: 900, y: 120,
        name: "Feature store", responsibility: "Versioned prepared data",
        detail: {
          overview: "Versioned prepared datasets with their pipeline record.",
          inputs: [io("Feature set", "From feature computation")],
          processing: "Stores immutable dataset versions plus the steps that produced them.",
          outputs: [io("Prepared dataset", "Training split handed to Stage 4"), io("Evaluation splits", "Held out for the Stage 5 evaluation data store")],
        },
      },
      {
        id: "to-stage-4", kind: "handoff", x: 900, y: 300,
        name: "→ Stage 4", responsibility: "Train and track experiments",
        detail: {
          overview: "Handoff of the training-ready dataset.",
          inputs: [io("Prepared dataset", "From the feature store")],
          processing: "Opens training with data, splits, and lineage attached.",
          outputs: [io("Training input", "Used by the orchestrator")],
        },
      },
      {
        id: "back-stage-2", kind: "handoff", x: 0, y: 300,
        name: "↩ Stage 2", responsibility: "Re-acquire data (failed checks)",
        detail: {
          overview: "Data that can't pass checks returns to acquisition.",
          inputs: [io("Check report", "From validation")],
          processing: "Flags the dataset as unfixable and requests better source data.",
          outputs: [io("Re-acquisition request", "Reopens data acquisition")],
        },
      },
    ],
    edges: [
      { id: "e0", source: "from-stage-2", target: "pipeline", label: "selected dataset", kind: "handoff", sourceHandle: "s-bottom", targetHandle: "t-top" },
      { id: "e1", source: "pipeline", target: "validation", label: "transformed data", kind: "flow" },
      { id: "e2", source: "validation", target: "features", label: "pass: checked data", kind: "flow" },
      { id: "e3", source: "features", target: "feature-store", label: "feature set", kind: "flow" },
      { id: "e4", source: "feature-store", target: "to-stage-4", label: "prepared dataset", kind: "handoff", sourceHandle: "s-bottom", targetHandle: "t-top" },
      { id: "e5", source: "validation", target: "pipeline", label: "improve: fix steps", kind: "decision", sourceHandle: "s-bottom", targetHandle: "t-bottom" },
      { id: "e6", source: "validation", target: "back-stage-2", label: "reject: re-acquire", kind: "decision", sourceHandle: "s-bottom", targetHandle: "t-right" },
    ],
  },

  /* 4 — Train and track experiments */
  {
    stageId: "train-experiments",
    nodes: [
      {
        id: "from-stage-3", kind: "handoff", x: 0, y: -60,
        name: "← Stage 3", responsibility: "Prepared dataset arrives",
        detail: {
          overview: "Incoming handoff: versioned features and splits.",
          inputs: [io("Prepared dataset", "From the feature store")],
          processing: "Attaches data, splits, and lineage to this stage.",
          outputs: [io("Training input", "Consumed by the orchestrator")],
        },
      },
      {
        id: "orchestrator", kind: "service", x: 0, y: 120,
        name: "Training orchestrator", responsibility: "Schedules experiment runs",
        detail: {
          overview: "Coordinates experiment runs with code and configuration.",
          inputs: [io("Training input", "Prepared data"), io("Code + config", "Model family, hyperparameters")],
          processing: "Queues runs, injects config, and tracks each run's identity.",
          outputs: [io("Run jobs", "Submitted to the runtime")],
        },
      },
      {
        id: "runtime", kind: "service", x: 300, y: 120,
        name: "Training runtime", responsibility: "Executes runs on compute",
        detail: {
          overview: "Simulated compute that executes training jobs.",
          inputs: [io("Run jobs", "From the orchestrator"), io("Environment", "Configured software stack")],
          processing: "Executes training, emits metrics, and writes model artifacts.",
          outputs: [io("Trained models", "Stored as artifacts"), io("Run telemetry", "Logged to the tracker")],
        },
      },
      {
        id: "tracker", kind: "store", x: 600, y: 120,
        name: "Experiment tracker", responsibility: "Runs, params, metrics",
        detail: {
          overview: "Records every run for reproducibility and comparison.",
          inputs: [io("Run telemetry", "From the runtime")],
          processing: "Indexes runs by parameters, metrics, and code version.",
          outputs: [io("Run records", "Comparable experiment history")],
        },
      },
      {
        id: "artifact-store", kind: "store", x: 600, y: 300,
        name: "Artifact store", responsibility: "Model files and binaries",
        detail: {
          overview: "Keeps model artifacts produced by training runs.",
          inputs: [io("Trained models", "From the runtime")],
          processing: "Stores versioned binaries linked to their run records.",
          outputs: [io("Model artifacts", "Candidates for evaluation")],
        },
      },
      {
        id: "to-stage-5", kind: "handoff", x: 900, y: 120,
        name: "→ Stage 5", responsibility: "Evaluate and validate",
        detail: {
          overview: "Handoff of candidate models with their run records.",
          inputs: [io("Model artifacts", "From the artifact store"), io("Run records", "From the tracker")],
          processing: "Bundles candidates and evidence for evaluation.",
          outputs: [io("Candidate models", "Scored in evaluation")],
        },
      },
    ],
    edges: [
      { id: "e0", source: "from-stage-3", target: "orchestrator", label: "prepared dataset", kind: "handoff", sourceHandle: "s-bottom", targetHandle: "t-top" },
      { id: "e1", source: "orchestrator", target: "runtime", label: "job + config", kind: "flow" },
      { id: "e2", source: "runtime", target: "tracker", label: "params + metrics", kind: "flow" },
      { id: "e3", source: "runtime", target: "artifact-store", label: "model artifacts", kind: "flow", sourceHandle: "s-bottom", targetHandle: "t-left" },
      { id: "e4", source: "tracker", target: "to-stage-5", label: "run records", kind: "handoff" },
      { id: "e5", source: "artifact-store", target: "to-stage-5", label: "candidate models", kind: "handoff", sourceHandle: "s-right", targetHandle: "t-bottom" },
    ],
  },

  /* 5 — Evaluate and validate */
  {
    stageId: "evaluate-validate",
    nodes: [
      {
        id: "from-stage-4", kind: "handoff", x: 0, y: -60,
        name: "← Stage 4", responsibility: "Candidate models arrive",
        detail: {
          overview: "Incoming handoff: candidates with run metadata.",
          inputs: [io("Candidate models", "From the artifact store"), io("Run records", "From the tracker")],
          processing: "Bundles candidates and their experiment lineage.",
          outputs: [io("Candidate models", "Scored by the evaluation service")],
        },
      },
      {
        id: "eval-data", kind: "store", x: 0, y: 120,
        name: "Evaluation data", responsibility: "Held-out and slice datasets",
        detail: {
          overview: "Held-out and representative slices for honest scoring.",
          inputs: [io("Evaluation splits", "From the Stage 3 feature store; transformed with training-fitted preprocessing only")],
          processing: "Serves the right slices for each evaluation run.",
          outputs: [io("Eval slices", "Fed to the evaluation service")],
        },
      },
      {
        id: "eval-service", kind: "service", x: 300, y: 120,
        name: "Evaluation service", responsibility: "Scores candidates vs criteria",
        detail: {
          overview: "Computes metrics for each candidate against success measures.",
          inputs: [io("Candidate models", "From training"), io("Eval slices", "From the data store"), io("Success criteria", "From the spec")],
          processing: "Runs scoring, slice analysis, and failure-case inspection; compares against baselines.",
          outputs: [io("Evaluation results", "Written to the results store")],
        },
      },
      {
        id: "results-store", kind: "store", x: 600, y: 120,
        name: "Results store", responsibility: "Reports and comparisons",
        detail: {
          overview: "Stores evaluation reports with full comparisons.",
          inputs: [io("Evaluation results", "From the evaluation service")],
          processing: "Versions reports per candidate and links them to runs.",
          outputs: [io("Evaluation report", "Read by the approval gate")],
        },
      },
      {
        id: "approval", kind: "service", x: 900, y: 120,
        name: "Approval gate", responsibility: "Pass / improve / reject decision",
        detail: {
          overview: "Decides whether a candidate may proceed to registration.",
          inputs: [io("Evaluation report", "From the results store"), io("Acceptance criteria", "From the spec")],
          processing: "Compares the report against thresholds; approves, requests improvement, or rejects.",
          outputs: [io("Decision", "Routes the candidate onward or back")],
        },
      },
      {
        id: "to-stage-6", kind: "handoff", x: 900, y: 300,
        name: "→ Stage 6", responsibility: "Register, package, and test",
        detail: {
          overview: "Handoff of the approved candidate.",
          inputs: [io("Decision", "From the approval gate")],
          processing: "Passes the approved model with its evaluation evidence.",
          outputs: [io("Approved model", "Input to registration")],
        },
      },
      {
        id: "back-stage-4", kind: "handoff", x: 300, y: 300,
        name: "↩ Stage 4", responsibility: "Retrain (improve / reject)",
        detail: {
          overview: "Candidates needing improvement or rejected for this release return to training with findings.",
          inputs: [io("Decision", "From the approval gate")],
          processing: "Sends failure analysis back so training can adjust.",
          outputs: [io("Retrain request", "Reopens experiments")],
        },
      },
    ],
    edges: [
      { id: "e0", source: "from-stage-4", target: "eval-service", label: "candidate + metadata", kind: "handoff", sourceHandle: "s-bottom", targetHandle: "t-top" },
      { id: "e1", source: "eval-data", target: "eval-service", label: "eval slices", kind: "flow" },
      { id: "e2", source: "eval-service", target: "results-store", label: "scores + slices", kind: "flow" },
      { id: "e3", source: "results-store", target: "approval", label: "evaluation report", kind: "flow" },
      { id: "e4", source: "approval", target: "to-stage-6", label: "pass: approved", kind: "handoff", sourceHandle: "s-bottom", targetHandle: "t-top" },
      { id: "e5", source: "approval", target: "back-stage-4", label: "improve / reject: retrain", kind: "decision", sourceHandle: "s-bottom", targetHandle: "t-right" },
    ],
  },

  /* 6 — Register, package, and test */
  {
    stageId: "register-package-test",
    nodes: [
      {
        id: "from-stage-5", kind: "handoff", x: 0, y: -60,
        name: "← Stage 5", responsibility: "Approved model arrives",
        detail: {
          overview: "Incoming handoff: the approved candidate with evidence.",
          inputs: [io("Approved model", "From the approval gate"), io("Evaluation report", "Attached as lineage")],
          processing: "Attaches approval evidence to this stage.",
          outputs: [io("Approved model", "Registered for release")],
        },
      },
      {
        id: "registry", kind: "store", x: 0, y: 120,
        name: "Model registry", responsibility: "Versioned model entries",
        detail: {
          overview: "Creates the versioned entry and lineage for the approved model.",
          inputs: [io("Approved model", "From the approval gate"), io("Metadata", "Code, deps, evaluation results")],
          processing: "Assigns a version, attaches lineage, and tracks status.",
          outputs: [io("Versioned entry", "Picked up by packaging")],
        },
      },
      {
        id: "build", kind: "service", x: 300, y: 120,
        name: "Packaging / build", responsibility: "Creates deployable package",
        detail: {
          overview: "Bundles the model with code and dependencies.",
          inputs: [io("Versioned entry", "From the registry")],
          processing: "Builds a self-contained deployable package with pinned deps.",
          outputs: [io("Deployable package", "Sent to the test runner")],
        },
      },
      {
        id: "test-runner", kind: "service", x: 600, y: 120,
        name: "Test runner", responsibility: "Release tests and approvals",
        detail: {
          overview: "Runs release tests before a package may deploy.",
          inputs: [io("Deployable package", "From build")],
          processing: "Executes smoke, interface, and performance tests; records results.",
          outputs: [io("Test results", "Archived with the version"), io("Release decision", "Pass routes to deploy")],
        },
      },
      {
        id: "test-store", kind: "store", x: 600, y: 300,
        name: "Test results store", responsibility: "Archived test evidence",
        detail: {
          overview: "Keeps test outcomes tied to model versions.",
          inputs: [io("Test results", "From the test runner")],
          processing: "Stores results against the registry version for audits.",
          outputs: [io("Release evidence", "Available to reviewers")],
        },
      },
      {
        id: "to-stage-7", kind: "handoff", x: 900, y: 120,
        name: "→ Stage 7", responsibility: "Deploy and serve",
        detail: {
          overview: "Handoff of the tested package.",
          inputs: [io("Release decision", "From the test runner")],
          processing: "Passes the approved package for deployment.",
          outputs: [io("Approved package", "Deployed to a target")],
        },
      },
    ],
    edges: [
      { id: "e0", source: "from-stage-5", target: "registry", label: "approved model", kind: "handoff", sourceHandle: "s-bottom", targetHandle: "t-top" },
      { id: "e1", source: "registry", target: "build", label: "versioned entry", kind: "flow" },
      { id: "e2", source: "build", target: "test-runner", label: "deployable package", kind: "flow" },
      { id: "e3", source: "test-runner", target: "test-store", label: "test results", kind: "flow", sourceHandle: "s-bottom", targetHandle: "t-top" },
      { id: "e4", source: "test-runner", target: "to-stage-7", label: "pass: approved", kind: "handoff" },
      { id: "e5", source: "test-runner", target: "build", label: "improve: fix", kind: "decision", sourceHandle: "s-top", targetHandle: "t-top" },
    ],
  },

  /* 7 — Deploy and serve */
  {
    stageId: "deploy-serve",
    nodes: [
      {
        id: "from-stage-6", kind: "handoff", x: 0, y: -60,
        name: "← Stage 6", responsibility: "Approved package arrives",
        detail: {
          overview: "Incoming handoff: the tested deployable package.",
          inputs: [io("Approved package", "From the test runner")],
          processing: "Attaches the package and test evidence to this stage.",
          outputs: [io("Approved package", "Deployed by the release service")],
        },
      },
      {
        id: "release", kind: "service", x: 0, y: 120,
        name: "Release service", responsibility: "Rolls out the package",
        detail: {
          overview: "Deploys the approved package to the target environment.",
          inputs: [io("Approved package", "From testing"), io("Deployment config", "Target, scaling, rollout")],
          processing: "Plans rollout, applies config, and records the deployment version.",
          outputs: [io("Release", "Provisioned serving workload"), io("Deployment record", "Enables rollback")],
        },
      },
      {
        id: "deploy-config", kind: "store", x: 0, y: 300,
        name: "Deployment config", responsibility: "Targets and rollout settings",
        detail: {
          overview: "Versioned configuration describing where and how to deploy.",
          inputs: [io("Config definitions", "Targets, scaling, limits")],
          processing: "Supplies the release service with the current target spec.",
          outputs: [io("Deployment config", "Consumed by the release")],
        },
      },
      {
        id: "endpoint", kind: "service", x: 300, y: 120,
        name: "Serving endpoint", responsibility: "Endpoint or batch job",
        detail: {
          overview: "Runs the model so applications can request predictions.",
          inputs: [io("Release", "From the release service")],
          processing: "Accepts prediction requests (or batch inputs) and returns outputs.",
          outputs: [io("Predictions", "Served to consumers"), io("Telemetry", "Streamed to monitoring")],
        },
      },
      {
        id: "consumer", kind: "external", x: 600, y: 120,
        name: "Consuming application", responsibility: "Requests predictions",
        detail: {
          overview: "The simulated downstream app that calls the model.",
          inputs: [io("Predictions", "From the endpoint")],
          processing: "Sends inputs and consumes model outputs in its own workflow.",
          outputs: [io("Usage signals", "Part of telemetry")],
        },
      },
      {
        id: "to-stage-8", kind: "handoff", x: 900, y: 120,
        name: "→ Stage 8", responsibility: "Monitor and respond",
        detail: {
          overview: "Handoff of serving outputs and telemetry.",
          inputs: [io("Telemetry", "From the endpoint")],
          processing: "Streams predictions and operating data to monitoring.",
          outputs: [io("Monitoring input", "Health and quality signals")],
        },
      },
    ],
    edges: [
      { id: "e0", source: "from-stage-6", target: "release", label: "approved package", kind: "handoff", sourceHandle: "s-bottom", targetHandle: "t-top" },
      { id: "e1", source: "deploy-config", target: "release", label: "target config", kind: "flow", sourceHandle: "s-top", targetHandle: "t-bottom" },
      { id: "e2", source: "release", target: "endpoint", label: "release + record", kind: "flow" },
      { id: "e3", source: "endpoint", target: "consumer", label: "predictions", kind: "flow" },
      { id: "e4", source: "endpoint", target: "to-stage-8", label: "outputs + telemetry", kind: "handoff", sourceHandle: "s-bottom", targetHandle: "t-bottom" },
      { id: "e5", source: "consumer", target: "endpoint", label: "prediction requests", kind: "flow", sourceHandle: "s-top", targetHandle: "t-top" },
    ],
  },

  /* 8 — Monitor and respond */
  {
    stageId: "monitor-respond",
    nodes: [
      {
        id: "from-stage-7", kind: "handoff", x: 0, y: -60,
        name: "← Stage 7", responsibility: "Serving telemetry arrives",
        detail: {
          overview: "Incoming handoff: predictions and operating data.",
          inputs: [io("Outputs + telemetry", "Streamed from the endpoint")],
          processing: "Attaches the live signal feed to this stage.",
          outputs: [io("Monitoring input", "Collected by the telemetry service")],
        },
      },
      {
        id: "telemetry", kind: "service", x: 0, y: 120,
        name: "Telemetry collector", responsibility: "Predictions and ops data",
        detail: {
          overview: "Collects predictions and operational signals from serving.",
          inputs: [io("Telemetry", "From the endpoint")],
          processing: "Aggregates inputs, outputs, latency, and errors into signals.",
          outputs: [io("Signals", "Assessed by the monitor")],
        },
      },
      {
        id: "monitor", kind: "service", x: 300, y: 120,
        name: "Monitor & drift evaluator", responsibility: "Health, quality, drift",
        detail: {
          overview: "Compares live signals against thresholds and baselines.",
          inputs: [io("Signals", "From the collector"), io("Thresholds", "Health and quality limits")],
          processing: "Detects data drift, quality drops, and service issues; decides whether to alert or trigger intervention.",
          outputs: [io("Assessments", "Metrics and decisions"), io("Drift events", "Routed to response")],
        },
      },
      {
        id: "alerts", kind: "service", x: 600, y: 120,
        name: "Alert & incident handling", responsibility: "Notifies and triages",
        detail: {
          overview: "Turns breaches into alerts and tracked incidents.",
          inputs: [io("Drift events", "From the monitor")],
          processing: "Notifies owners, opens incidents, and proposes responses.",
          outputs: [io("Incidents", "Drove the response decision")],
        },
      },
      {
        id: "feedback-queue", kind: "store", x: 300, y: 300,
        name: "Feedback queue", responsibility: "Retraining and review work",
        detail: {
          overview: "Queues the follow-up work a response requires.",
          inputs: [io("Incidents", "From alerts"), io("Assessments", "From the monitor")],
          processing: "Prioritizes interventions and routes them to the right earlier stage.",
          outputs: [io("Feedback items", "Loop back into the lifecycle")],
        },
      },
      {
        id: "fb-train", kind: "handoff", x: 0, y: 480,
        name: "↩ Stage 4", responsibility: "Retrain on quality drop",
        detail: {
          overview: "Model quality below threshold triggers retraining.",
          inputs: [io("Feedback items", "From the queue")],
          processing: "Opens a new training round with the observed failure modes.",
          outputs: [io("Retrain trigger", "Quality/drift driven")],
        },
      },
      {
        id: "fb-data", kind: "handoff", x: 260, y: 480,
        name: "↩ Stage 2", responsibility: "Re-acquire on data drift",
        detail: {
          overview: "Data drift sends the team back to acquisition.",
          inputs: [io("Feedback items", "From the queue")],
          processing: "Requests fresher or better-matched source data.",
          outputs: [io("Re-acquisition trigger", "Drift driven")],
        },
      },
      {
        id: "fb-define", kind: "handoff", x: 520, y: 480,
        name: "↩ Stage 1", responsibility: "Redefine on need change",
        detail: {
          overview: "A changed business need reopens problem definition.",
          inputs: [io("Feedback items", "From the queue")],
          processing: "Signals that success measures or the task itself changed.",
          outputs: [io("Redefinition trigger", "Need driven")],
        },
      },
    ],
    edges: [
      { id: "e0", source: "from-stage-7", target: "telemetry", label: "outputs + telemetry", kind: "handoff", sourceHandle: "s-bottom", targetHandle: "t-top" },
      { id: "e1", source: "telemetry", target: "monitor", label: "predictions + ops data", kind: "flow" },
      { id: "e2", source: "monitor", target: "alerts", label: "threshold breach", kind: "flow" },
      { id: "e3", source: "monitor", target: "feedback-queue", label: "drift / quality drop", kind: "flow", sourceHandle: "s-bottom", targetHandle: "t-top" },
      { id: "e4", source: "alerts", target: "feedback-queue", label: "incidents", kind: "flow", sourceHandle: "s-bottom", targetHandle: "t-top" },
      { id: "e5", source: "feedback-queue", target: "fb-train", label: "retrain (quality drop)", kind: "decision", sourceHandle: "s-bottom", targetHandle: "t-top" },
      { id: "e6", source: "feedback-queue", target: "fb-data", label: "re-acquire (data drift)", kind: "decision", sourceHandle: "s-bottom", targetHandle: "t-top" },
      { id: "e7", source: "feedback-queue", target: "fb-define", label: "redefine (need change)", kind: "decision", sourceHandle: "s-bottom", targetHandle: "t-top" },
    ],
  },
];

export function getStageDiagram(stageId: string): StageDiagram | undefined {
  return stageDiagrams.find((d) => d.stageId === stageId);
}
