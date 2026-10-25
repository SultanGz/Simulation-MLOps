/**
 * Provider-neutral environment options and the simulated preflight checks.
 * Nothing here installs packages or contacts a service — validation results
 * are computed deterministically from the chosen configuration.
 */

export interface EnvOption {
  id: string;
  label: string;
  /** One-sentence explanation. */
  note: string;
}

export interface EnvGroup {
  key: keyof EnvConfig;
  label: string;
  options: EnvOption[];
}

export interface EnvConfig {
  language: string;
  library: string;
  environment: string;
  compute: string;
}

export const envGroups: EnvGroup[] = [
  {
    key: "language",
    label: "Programming language",
    options: [
      { id: "python", label: "Python", note: "The most common ML ecosystem." },
      { id: "r", label: "R", note: "Strong for statistics-focused work." },
    ],
  },
  {
    key: "library",
    label: "ML library",
    options: [
      { id: "scikit-learn", label: "scikit-learn", note: "Classic ML models; runs comfortably on CPU." },
      { id: "pytorch", label: "PyTorch", note: "Neural networks; benefits a lot from a GPU." },
      { id: "xgboost", label: "XGBoost", note: "Gradient-boosted trees for tabular data." },
      { id: "tidymodels", label: "tidymodels", note: "R-native modeling framework." },
    ],
  },
  {
    key: "environment",
    label: "Software environment",
    options: [
      { id: "venv", label: "venv + pip", note: "Lightweight per-project isolation." },
      { id: "conda", label: "conda", note: "Manages packages and native dependencies." },
      { id: "container", label: "Container image", note: "Pinned images support reproducibility; host and hardware still matter." },
    ],
  },
  {
    key: "compute",
    label: "Compute",
    options: [
      { id: "cpu", label: "Local CPU", note: "This machine's processor — fine for classic models." },
      { id: "gpu", label: "Single GPU", note: "A workstation GPU for heavier training." },
      { id: "cloud-gpu", label: "Rented GPU instance", note: "Generic on-demand GPU, no specific provider." },
    ],
  },
];

export const presetConfig: EnvConfig = {
  language: "python",
  library: "scikit-learn",
  environment: "venv",
  compute: "cpu",
};

export function optionLabel(key: keyof EnvConfig, id: string): string {
  return (
    envGroups.find((g) => g.key === key)?.options.find((o) => o.id === id)
      ?.label ?? id
  );
}

/* ---------- Simulated validation ---------- */

export type CheckStatus = "pending" | "running" | "passed" | "failed";

export interface CheckResult {
  id: string;
  label: string;
  status: Exclude<CheckStatus, "pending" | "running">;
  detail: string;
  /** Optional simulated fix: a new config that resolves the failure. */
  fix?: { label: string; config: EnvConfig };
}

/** Deterministic rules — the chosen configuration decides the outcome. */
export function evaluateChecks(config: EnvConfig): CheckResult[] {
  const results: CheckResult[] = [];

  results.push({
    id: "runtime",
    label: "Runtime",
    status: "passed",
    detail: `${optionLabel("language", config.language)} runtime is available.`,
  });

  const supportedLanguages: Record<string, string[]> = {
    "scikit-learn": ["python"],
    pytorch: ["python"],
    xgboost: ["python", "r"],
    tidymodels: ["r"],
  };
  const languages = supportedLanguages[config.library] ?? [];
  if (!languages.includes(config.language)) {
    const needed = languages[0] ?? "python";
    results.push({
      id: "dependencies",
      label: "Dependencies",
      status: "failed",
      detail: `${optionLabel("library", config.library)} targets ${optionLabel("language", needed)} — it can't be installed in this ${optionLabel("language", config.language)} environment.`,
      fix: {
        label: `Switch language to ${optionLabel("language", needed)}`,
        config: { ...config, language: needed },
      },
    });
  } else if (config.language === "r" && config.environment === "venv") {
    results.push({
      id: "dependencies",
      label: "Dependencies",
      status: "failed",
      detail: "venv + pip isolates Python packages, not R. Use conda with R packages or an R-enabled container image.",
      fix: {
        label: "Switch environment to conda",
        config: { ...config, environment: "conda" },
      },
    });
  } else {
    results.push({
      id: "dependencies",
      label: "Dependencies",
      status: "passed",
      detail: `${optionLabel("library", config.library)} resolves in a ${optionLabel("environment", config.environment)} environment.`,
    });
  }

  results.push({
    id: "data-access",
    label: "Data access",
    status: "passed",
    detail: "The bundled sample dataset is readable — no external storage needed.",
  });

  if (config.library === "pytorch" && config.compute === "cpu") {
    results.push({
      id: "compute",
      label: "Compute",
      status: "passed",
      detail:
        "PyTorch supports CPU training. Larger models may train slowly; consider a GPU if runtime becomes a constraint.",
    });
  } else {
    results.push({
      id: "compute",
      label: "Compute",
      status: "passed",
      detail: `${optionLabel("compute", config.compute)} is adequate for ${optionLabel("library", config.library)} in this scenario.`,
    });
  }

  return results;
}
