/**
 * The provider-neutral MLOps lifecycle the website simulates.
 *
 * Every stage has the same explanation shape — Overview, Inputs, Processing,
 * Outputs — rendered as an inline card on the canvas when the stage is
 * selected. These stages are educational concepts; real platforms organize
 * them differently.
 */

export interface StageIO {
  /** Short artifact/signal name. */
  name: string;
  /** What it is (inputs) or how it is used downstream (outputs). */
  note: string;
}

export interface LifecycleStage {
  id: string;
  order: number;
  name: string;
  /** Overview — what the stage is for, in one sentence. */
  summary: string;
  /** What enters the stage. */
  inputs: StageIO[];
  /** The main actions performed on those inputs. */
  processing: string;
  /** What the stage produces. */
  outputs: StageIO[];
}

export const lifecycleStages: LifecycleStage[] = [
  {
    id: "define-problem",
    order: 1,
    name: "Define the problem",
    summary: "Turn a user or business need into a concrete, measurable ML task.",
    inputs: [
      { name: "Business need", note: "The user problem or decision the model should support." },
      { name: "Constraints", note: "Limits on latency, cost, fairness, or explainability." },
      { name: "Available data", note: "What data exists today or could be collected." },
    ],
    processing:
      "Frame the need as an ML task, choose measurable success criteria, and set acceptance thresholds.",
    outputs: [
      { name: "ML task definition", note: "Guides every later stage." },
      { name: "Success measures", note: "Used to score candidates in Evaluate and validate." },
      { name: "Acceptance criteria", note: "Gate candidate approval in Evaluate and validate (Stage 5)." },
    ],
  },
  {
    id: "acquire-data",
    order: 2,
    name: "Acquire and understand data",
    summary: "Find, profile, and judge whether the data fits the task.",
    inputs: [
      { name: "Data sources", note: "Systems, files, or streams holding relevant data." },
      { name: "Access rules", note: "Permissions, privacy, and licensing limits." },
      { name: "Problem definition", note: "Sets what counts as relevant data." },
    ],
    processing:
      "Collect samples, profile distributions, and check quality — missing values, imbalance, early drift.",
    outputs: [
      { name: "Profiled dataset", note: "The input to Prepare data and features." },
      { name: "Quality findings", note: "May send you back to refine the problem." },
      { name: "Suitability decision", note: "A go/no-go for modeling." },
    ],
  },
  {
    id: "prepare-data",
    order: 3,
    name: "Prepare data and features",
    summary: "Clean and transform approved data into training-ready features.",
    inputs: [
      { name: "Selected dataset", note: "Data approved in the previous stage." },
      { name: "Quality requirements", note: "Thresholds derived from the findings." },
    ],
    processing:
      "Split training and evaluation data before learned preprocessing; fit preprocessing and feature steps on training data only, then transform evaluation data without refitting. Record the pipeline and split lineage.",
    outputs: [
      { name: "Prepared features", note: "Fed into Train and track experiments." },
      { name: "Repeatable pipeline", note: "Re-run whenever data changes." },
      { name: "Data record", note: "Lineage used for audits and debugging." },
    ],
  },
  {
    id: "train-experiments",
    order: 4,
    name: "Train and track experiments",
    summary: "Train candidate models and record every experiment run.",
    inputs: [
      { name: "Prepared data", note: "Features produced upstream." },
      { name: "Training code + config", note: "Model family and hyperparameters." },
      { name: "Environment", note: "The compute and dependencies runs execute in." },
    ],
    processing:
      "Run experiments, tune hyperparameters, and log each run's parameters, metrics, and artifacts.",
    outputs: [
      { name: "Candidate models", note: "Sent to Evaluate and validate." },
      { name: "Run records", note: "Make every result reproducible." },
      { name: "Model artifacts", note: "Packaged later in Register, package, and test." },
    ],
  },
  {
    id: "evaluate-validate",
    order: 5,
    name: "Evaluate and validate",
    summary: "Score candidates against success, quality, and safety criteria.",
    inputs: [
      { name: "Candidate models", note: "Everything trained in the previous stage." },
      { name: "Evaluation data", note: "Held-out or representative slices." },
      { name: "Success + safety requirements", note: "From the problem definition and policy." },
    ],
    processing:
      "Score candidates on success measures, inspect slices and failure cases, and compare with baselines.",
    outputs: [
      { name: "Evaluation results", note: "Evidence behind the decision." },
      { name: "Approve / improve / reject", note: "Approves packaging, or loops back to training." },
    ],
  },
  {
    id: "register-package-test",
    order: 6,
    name: "Register, package, and test",
    summary: "Version the approved model and package it for release.",
    inputs: [
      { name: "Approved candidate", note: "The model chosen in evaluation." },
      { name: "Code, deps + metadata", note: "Everything needed to reproduce it." },
      { name: "Evaluation results", note: "Attached as lineage and evidence." },
    ],
    processing:
      "Create a versioned registry entry, build a deployable package, and run release tests.",
    outputs: [
      { name: "Versioned model entry", note: "Traceable lineage for audits." },
      { name: "Deployable package", note: "The input to Deploy and serve." },
      { name: "Test results", note: "Release evidence kept with the version." },
    ],
  },
  {
    id: "deploy-serve",
    order: 7,
    name: "Deploy and serve",
    summary: "Release the package so applications can request predictions.",
    inputs: [
      { name: "Approved package", note: "Built and tested in the previous stage." },
      { name: "Deployment config", note: "Target, scaling, and rollout settings." },
      { name: "Target environment", note: "Where the model will run." },
    ],
    processing:
      "Roll out the package, route prediction traffic, and record the deployed version.",
    outputs: [
      { name: "Running endpoint or job", note: "Serves predictions to applications." },
      { name: "Deployment record", note: "Enables rollback to a prior version." },
      { name: "Prediction stream", note: "Feeds Monitor and respond." },
    ],
  },
  {
    id: "monitor-respond",
    order: 8,
    name: "Monitor and respond",
    summary: "Watch the running model and feed issues back into the cycle.",
    inputs: [
      { name: "Predictions + operating data", note: "Signals from the deployed model." },
      { name: "Thresholds", note: "Health and model-quality limits to watch." },
    ],
    processing:
      "Track health and quality signals, detect drift, raise alerts, and decide whether to intervene.",
    outputs: [
      { name: "Signals + alerts", note: "Inform operators of model health." },
      { name: "Intervention decision", note: "Triggers the feedback loop back to earlier stages." },
    ],
  },
];
