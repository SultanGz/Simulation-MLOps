import type { NodeProps, Node } from "@xyflow/react";
import { lifecycleStages } from "../lifecycle/lifecycleData";
import { envGroups, type EnvConfig, type CheckStatus } from "./preflightData";

export interface PreflightActions {
  onSetup(): void;
  onPick(key: keyof EnvConfig, id: string): void;
  onPreset(): void;
  onValidate(): void;
  onBackToSetup(): void;
  onApplyFix(config: EnvConfig): void;
  onResetSetup(): void;
  onStart(): void;
}

export interface DisplayedCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail?: string;
  fix?: { label: string; config: EnvConfig };
}

export type PreflightFlowNode = Node<
  {
    scene: "welcome" | "setup" | "validate";
    config: EnvConfig;
    checks: DisplayedCheck[];
    actions: PreflightActions;
  },
  "preflightPanel"
>;

const CHECK_ICON: Record<CheckStatus, string> = {
  pending: "○",
  running: "…",
  passed: "✓",
  failed: "✗",
};

export function PreflightPanelNode({ data }: NodeProps<PreflightFlowNode>) {
  const { scene, config, checks, actions } = data;

  return (
    <div className="preflight-card">
      {scene === "welcome" && (
        <>
          <span className="preflight-card__eyebrow">Welcome</span>
          <h2 className="preflight-card__title">simulation-MLOps</h2>
          <p className="preflight-card__text">
            Learn how a machine-learning project actually ships: you'll
            configure a training environment, validate it, then walk a model
            through the eight-stage MLOps lifecycle — all simulated in your
            browser, no real services involved.
          </p>
          <div className="preflight-card__preview" aria-hidden="true">
            {lifecycleStages.map((s) => (
              <span key={s.id} className="preflight-card__dot">
                {s.order}
              </span>
            ))}
          </div>
          <p className="preflight-card__text preflight-card__text--muted">
            The eight stages of the lifecycle you'll simulate, laid out on this
            canvas.
          </p>
          <button type="button" className="btn" onClick={actions.onSetup}>
            Set up simulation
          </button>
        </>
      )}

      {scene === "setup" && (
        <>
          <span className="preflight-card__eyebrow">Step 1 · Configure environment</span>
          <h2 className="preflight-card__title">Choose your stack</h2>
          <p className="preflight-card__text preflight-card__text--muted">
            Simulated only — nothing is installed or downloaded.
          </p>
          {envGroups.map((group) => (
            <fieldset key={group.key} className="env-group">
              <legend>{group.label}</legend>
              <div className="env-group__options">
                {group.options.map((opt) => {
                  const active = config[group.key] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`env-option${active ? " env-option--active" : ""}`}
                      aria-pressed={active}
                      title={opt.note}
                      onClick={() => actions.onPick(group.key, opt.id)}
                    >
                      <strong>{opt.label}</strong>
                      <span>{opt.note}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
          <div className="preflight-card__actions">
            <button type="button" className="btn" onClick={actions.onValidate}>
              Run validation
            </button>
            <button type="button" className="btn btn--ghost" onClick={actions.onPreset}>
              Use recommended preset
            </button>
            <button type="button" className="btn btn--ghost" onClick={actions.onResetSetup}>
              Reset setup
            </button>
          </div>
        </>
      )}

      {scene === "validate" && (
        <>
          <span className="preflight-card__eyebrow">Step 2 · Validate</span>
          <h2 className="preflight-card__title">Simulated environment checks</h2>
          <ul className="check-list">
            {checks.map((c) => (
              <li key={c.id} className={`check check--${c.status}`}>
                <span className="check__icon" aria-hidden="true">
                  {CHECK_ICON[c.status]}
                </span>
                <div className="check__body">
                  <strong>{c.label}</strong>
                  {c.detail && <p>{c.detail}</p>}
                  {c.status === "failed" && c.fix && (
                    <button
                      type="button"
                      className="btn btn--ghost check__fix"
                      onClick={() => actions.onApplyFix(c.fix!.config)}
                    >
                      {c.fix.label}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="preflight-card__actions">
            {checks.length > 0 && checks.every((c) => c.status === "passed") && (
              <button type="button" className="btn" onClick={actions.onStart}>
                ▶ Start simulation
              </button>
            )}
            <button type="button" className="btn btn--ghost" onClick={actions.onBackToSetup}>
              Back to configuration
            </button>
          </div>
          {checks.some((c) => c.status === "failed") && (
            <p className="preflight-card__text preflight-card__text--muted">
              Fix the failing checks, then run validation again.
            </p>
          )}
        </>
      )}
    </div>
  );
}
