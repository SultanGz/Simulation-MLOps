# simulation-MLOps

An educational website for interactively learning the MLOps lifecycle through
guided, in-browser simulations: a **lifecycle overview** and per-stage
**C4-inspired service flows**, plus a small deterministic sample simulation.
These educational views are not formal C4 System Context or Container diagrams.

## Run it

```sh
npm install
npm run dev
```

Then open the URL Vite prints (default <http://localhost:5173>).

Other scripts:

```sh
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build locally
```

Requirements: Node.js 18+ and npm. No accounts, credentials, network calls, or
backend services are needed at runtime — all scenario data is bundled.

## What's in this milestone

The app is an **immersive, full-viewport React Flow dashboard**. Setup, help,
stages, explanations, services, and their relationships all live inside the canvas.
There are no permanent sidebars or header strip. A compact bottom-center transport
panel contains previous/play/next controls, stage name, status, and current level.
A collapsible dashboard menu contains secondary controls. The journey has four steps:

1. **Welcome** — what the site teaches plus a preview of the lifecycle, with
   one action: "Set up walkthrough".
2. **Configure environment** — provider-neutral picks for language, ML
   library, software environment, and compute, each explained in one sentence
   (recommended preset available). Fully simulated — nothing is installed.
3. **Validate** — simulated checks for runtime, dependencies, data access,
   and compute animate in sequence. Deterministic rules mean your choices
   matter: XGBoost supports Python and R; R needs conda or an R-enabled image,
   not venv + pip. PyTorch on CPU passes with a performance advisory.
4. **Explore** — "Begin walkthrough" appears only after all checks pass and
   opens the lifecycle overview. The bottom panel shows walkthrough progress;
   inspecting any other stage does not advance progress.

"Reset setup" and "Reset progress" are separate controls. Edit the environment
without losing your choices, and restart the walkthrough after resetting progress.
Reduced-motion preferences skip staggered checks and animated camera movement.
Help and official references are an on-canvas scene; external links open in a new tab.

### Diagram views

Select a stage and choose **Explore stage services**, or double-click the stage,
to drill into its service diagram. The compact MLOps lab button returns to the
lifecycle overview. The dashboard menu provides a labeled service selector.

- **Overview** — the lifecycle overview described below, not a C4 System Context view.
- **Level 2 · Current stage** — the selected lifecycle stage has a named boundary
  and its current/completed/upcoming status. Services and stores are inside;
  incoming/outgoing handoffs, feedback destinations, and external actors are outside.
  Labeled arrows show data flow and decisions. Selecting a node opens its explanation.
- **Level 2 · All stages** — all eight boundaries and their internal services/stores,
  connected by cross-stage handoffs and feedback. Select any stage or contained node
  to focus that stage. This overview is intended for pan/zoom exploration.
- **Current level** in the bottom panel switches views while preserving the selected
  stage. The arrows navigate stages; the menu provides a service selector for keyboard inspection.

The lifecycle itself:

- **Serpentine sequence** — eight provider-neutral stages on a precise 4×2
  path: 1–4 left-to-right, a turn downward, then 5–8 right-to-left, with
  directional arrows and a dashed **feedback loop** from Monitor and respond
  back to Define the problem.
- **Contextual stage details** — selecting a stage opens its connected summary.
  Expand the explanation for Inputs, Processing, and Outputs. One detail card is
  visible at a time, parked in a reserved lane clear of the diagram. On narrow
  screens, the camera frames the card alone to preserve readable text.
- **States** — completed, current, and upcoming stages are visually distinct.

Dashboard controls remain compact and within the canvas viewport:

- **Tool cluster**: lifecycle overview and collapsed dashboard menu.
- **Bottom-center panel**: previous-stage arrow, middle play button, next-stage arrow,
  stage name/status, playback progress, and Current level selector. The icon-only
  play button starts timed simulation and becomes Pause while running; paused
  playback resumes from the same step, and completed playback can restart.
- **Level-scoped playback**: Level 1 illustrates eight lifecycle stages. Focused
  Level 2 illustrates the selected stage's service/data flow; the full Level 2
  overview follows 46 happy-path nodes across all stages. Progress is independent
  for Level 1, each focused stage, and the Level 2 overview. Steps last 3.2 seconds.
  Switching levels, navigating stages, opening help/setup, or inspecting nodes
  pauses playback. Reset affects only the current view's playback.
- **Collapsed menu**: service selector, environment, reset, theme, help.
- **Contextual cards**: overview, expand/collapse, close, and service drill-down.
- **Accessibility**: skip link, visible focus, labeled selectors, status announcements,
  Enter-to-inspect focused nodes, and Escape to dismiss menu/help.

Canvas behavior:

- Pan/zoom freely, compact zoom controls, fit-to-view, Reset view; no persistent minimap.
- Clicking a stage selects it and reveals its details — without changing
  simulation progress.
- Start runs a deterministic, timed sequence in the selected level. Active nodes
  and incoming relationships are highlighted; completed transfers remain marked.
  Focused views open the current explanation, while the Level 2 overview frames
  the active stage/node. Pause stops advancement and edge animation. Reduced
  motion disables camera/edge animation without disabling timed progression.
  Branches are explanatory, not executable decisions; playback follows a fixed happy path.
- **Dark theme**: light by default, dashboard-menu toggle; the canvas follows via
  `colorMode`.

## Project layout

```
src/
  App.tsx                        app shell: canvas + HUD overlays (brand/theme, toolbar)
  index.css                      theme variables + stage node/card/HUD styles
  features/
    canvas/
      WorkspaceCanvas.tsx        React Flow canvas: stage chain, feedback loop, camera control
      StageNode.tsx              compact lifecycle stage node
      StageDetailNode.tsx        inline Input/Output card attached to the selected stage
    containers/
      containerData.ts           per-stage container diagrams (nodes, labeled edges, details)
      ContainerNode.tsx          service/store/external/handoff node renderer
      ContainerDetailNode.tsx    on-canvas Overview→Inputs→Processing→Outputs card
      Level2Canvas.tsx           container-view canvas: diagram, legend, camera
    lifecycle/
      lifecycleData.ts           the eight provider-neutral lifecycle stages (inputs/outputs)
    preflight/
      preflightData.ts           env options, preset, deterministic check evaluator
      PreflightPanelNode.tsx     welcome/setup/validate scenes as canvas panels
    simulation/
      simulation.ts              deterministic Start/Next/Reset state machine (env-aware steps)
```

## Choices and scope notes

- **Provider-neutral by design.** Lifecycle concepts (data sources, source
  control/CI, experiment tracking, model registries, deployment runtimes,
  monitoring) are described generically and represented by bundled sample data.
  The site does not imply connections to real services; provider-specific
  examples can be added later as scenario variants.
- **No backend, auth, or real integrations.** The simulation state lives in the
  browser and resets per session.
- **Fixed node positions.** The diagram is a guided view, not a drag-to-author
  editor; nodes are not draggable.
- **Minimal dependencies.** Only React, `@xyflow/react`, and the Vite/TS
  toolchain.

## Intentionally deferred

- Deeper component/code views beyond the current stage service flows.
- Multiple/real scenarios, a full lifecycle simulator, and executable decision branching.
- Instructor-specific views, progress persistence, and i18n.
- Any live integration with external MLOps tooling.
