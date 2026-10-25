/**
 * The provider-neutral MLOps lifecycle the website simulates.
 *
 * These stages are educational concepts — real platforms organize them
 * differently. Each stage lists a plain-language input and output so the
 * learner can see what flows in and what each stage produces.
 */

export interface LifecycleStage {
  id: string;
  order: number;
  name: string;
  /** What the stage is about, in one sentence. */
  summary: string;
  input: string;
  output: string;
}

export const lifecycleStages: LifecycleStage[] = [
  {
    id: "define-problem",
    order: 1,
    name: "Define the problem",
    summary: "Turn a user or business need into a concrete ML task.",
    input: "A user or business need, constraints, and available data.",
    output: "A clear ML task, success measures, and acceptance criteria.",
  },
  {
    id: "acquire-data",
    order: 2,
    name: "Acquire and understand data",
    summary: "Find, profile, and judge the data needed for the task.",
    input: "Data sources, data access rules, and the problem definition.",
    output:
      "A profiled dataset, data-quality findings, and a decision about whether the data is suitable.",
  },
  {
    id: "prepare-data",
    order: 3,
    name: "Prepare data and features",
    summary: "Clean and transform data into training-ready features.",
    input: "The selected data and quality requirements.",
    output:
      "Cleaned, transformed data for training and evaluation, plus a repeatable preparation process and record of the data used.",
  },
  {
    id: "train-experiments",
    order: 4,
    name: "Train and track experiments",
    summary: "Train candidate models and record every experiment run.",
    input: "Prepared data, training code, configuration, and a software environment.",
    output:
      "Candidate models, run details, parameters, metrics, and model artifacts. Experiment tracking records how each candidate was produced.",
  },
  {
    id: "evaluate-validate",
    order: 5,
    name: "Evaluate and validate",
    summary: "Measure candidates against success and safety criteria.",
    input:
      "Candidate models, evaluation data, success measures, and any quality or safety requirements.",
    output:
      "Evaluation results and a decision to reject, improve, or approve a candidate.",
  },
  {
    id: "register-package-test",
    order: 6,
    name: "Register, package, and test",
    summary: "Version the approved model and package it for release.",
    input:
      "An approved candidate and its code, dependencies, metadata, and evaluation results.",
    output:
      "A versioned model entry and a deployable package, with test and approval results. Model registries track versions and their lineage.",
  },
  {
    id: "deploy-serve",
    order: 7,
    name: "Deploy and serve",
    summary: "Release the package so applications can request predictions.",
    input: "The approved package, deployment configuration, and target environment.",
    output:
      "A running model endpoint or batch process, a recorded deployment version, and a way for an application or job to request predictions.",
  },
  {
    id: "monitor-respond",
    order: 8,
    name: "Monitor and respond",
    summary: "Watch the running model and feed issues back into the cycle.",
    input:
      "Predictions and operating data from the deployed model, plus performance and quality thresholds.",
    output:
      "Health and model-quality signals, alerts or decisions, and — when needed — a feedback loop to investigate data, retrain, evaluate, and release a new version.",
  },
];
