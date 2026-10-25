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
  onDismissHelp?(): void;
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
    scene: "welcome" | "setup" | "validate" | "help";
    config: EnvConfig;
    checks: DisplayedCheck[];
    actions: PreflightActions;
    references?: { label: string; url: string }[];
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
  return <PreflightPanel data={data} />;
}

export function PreflightPanel({ data }: { data: PreflightFlowNode["data"] }) {
  const { scene, config, checks, actions, references } = data;

  return (
    <div
      className="preflight-card nodrag nopan nowheel"
      role="region"
      aria-label={
        scene === "help" ? "Dashboard help and sources" : "Walkthrough setup"
      }
      tabIndex={0}
    >
      {scene === "help" && (
        <>
          <span className="preflight-card__eyebrow">Inside the dashboard</span>
          <h2 className="preflight-card__title">Explore the lifecycle</h2>
          <p className="preflight-card__text">
            Select a stage to open its connected explanation. Expand its inputs,
            processing, and outputs, or explore the services behind it.
            Double-click a stage to go directly to its services.
          </p>
          <p className="preflight-card__text">
            The bottom-center panel shows the selected stage, playback status,
            and current level. The play icon starts automatic simulation and
            becomes Pause while running. Press play again to resume, or restart
            after completion. Each step stays visible for a few seconds. The
            arrows navigate stages manually; navigation or switching levels
            pauses playback. Each level keeps its own progress.
          </p>
          <p className="preflight-card__text">
            Use Current level to switch between the lifecycle, a focused Level 2
            stage, and the complete Level 2 overview. Level 1 illustrates each
            lifecycle stage; Level 2 follows the services and data transfers in
            the selected stage, or across all stages in the overview. It never
            switches levels automatically. Stage boundaries contain their
            internal services and stores; handoffs sit outside. Select a stage
            in the full overview to focus it. The dashboard menu contains a
            service selector, environment settings, theme, and reset. Escape
            closes the menu or help.
          </p>
          <p className="preflight-card__text preflight-card__text--muted">
            This provider-neutral educational model illustrates possible
            decisions; it does not execute branches, train models, or deploy
            services. Service diagrams are C4-inspired data flows, not formal C4
            architecture views.
          </p>
          <details className="canvas-sources">
            <summary>Official references</summary>
            <ul>
              {references?.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {source.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
            <small>Reviewed 25 October 2026</small>
          </details>
          <div className="preflight-card__actions">
            <button className="btn" onClick={actions.onDismissHelp}>
              Back to dashboard
            </button>
          </div>
        </>
      )}
      {scene === "welcome" && (
        <>
          <span className="preflight-card__eyebrow">Welcome</span>
          <h2 className="preflight-card__title">
            From a business problem to a model in production.
          </h2>
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
            Explore eight connected stages, inspect the services behind them,
            and learn what each stage hands to the next. This guided happy-path
            walkthrough does not train or deploy a real model.
          </p>
          <button type="button" className="btn" onClick={actions.onSetup}>
            Set up walkthrough
          </button>
        </>
      )}

      {scene === "setup" && (
        <>
          <span className="preflight-card__eyebrow">
            Step 1 · Configure environment
          </span>
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
              Check compatibility
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={actions.onPreset}
            >
              Use recommended preset
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={actions.onResetSetup}
            >
              Reset setup
            </button>
          </div>
        </>
      )}

      {scene === "validate" && (
        <>
          <span className="preflight-card__eyebrow">Step 2 · Validate</span>
          <h2 className="preflight-card__title">
            Simulated environment checks
          </h2>
          <p className="preflight-card__text preflight-card__text--muted">
            These checks use educational rules, not your actual machine or
            installed software.
          </p>
          <p role="status" aria-live="polite" className="preflight-card__text">
            {checks.some(
              (c) => c.status === "pending" || c.status === "running",
            )
              ? "Checking your selected stack…"
              : checks.some((c) => c.status === "failed")
                ? "Changes needed. Review the checks below."
                : "Your simulated stack is ready."}
          </p>
          <ul className="check-list">
            {checks.map((c) => (
              <li key={c.id} className={`check check--${c.status}`}>
                <span className="check__icon" aria-hidden="true">
                  {CHECK_ICON[c.status]}
                </span>
                <div className="check__body">
                  <strong>{c.label}</strong>{" "}
                  <span className="check__status">{c.status}</span>
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
            {checks.length > 0 &&
              checks.every((c) => c.status === "passed") && (
                <button type="button" className="btn" onClick={actions.onStart}>
                  Begin walkthrough
                </button>
              )}
            <button
              type="button"
              className="btn btn--ghost"
              onClick={actions.onBackToSetup}
            >
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
