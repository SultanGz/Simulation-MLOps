# simulation-MLOps

An educational website for interactively learning the MLOps lifecycle through
guided, in-browser simulations. This milestone ships the **C4 Level 1 (System
Context)** view only: who uses the system, the system boundary, and how they
relate — plus a small deterministic sample simulation.

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

The app is a **single full-viewport canvas** (React Flow), not a scrolling
page. The only content is the MLOps lifecycle itself:

- **Serpentine sequence** — eight provider-neutral stages on a precise 4×2
  path: 1–4 left-to-right, a turn downward, then 5–8 right-to-left, with
  directional arrows and a dashed **feedback loop** from Monitor and respond
  back to Define the problem.
- **Inline stage details** — selecting a stage attaches a detail card node on
  the canvas (connected to the stage) showing what it does plus its labeled
  Input and Output. Only the selected stage expands; cards are positioned to
  avoid the chain and feedback edges.
- **States** — completed, current, and upcoming stages are visually distinct.

Screen-fixed overlays (they do not scroll or drift with the canvas):

- **Header HUD**: product name and theme toggle.
- **Toolbar HUD**: Start / Next / Reset and a "Stage N of 8" progress chip.

Canvas behavior:

- Pan/zoom freely, zoom controls, mini-map, fit-to-view, Reset view.
- Clicking a stage selects it and reveals its details — without changing
  simulation progress.
- Start begins the seeded scenario; Next advances one stage, highlights it,
  and glides the camera to it; Reset returns the simulation, selection, and
  camera to the start. Fully deterministic — no timers or randomness.
- **Dark theme**: light by default, header toggle; the canvas follows via
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
    lifecycle/
      lifecycleData.ts           the eight provider-neutral lifecycle stages (inputs/outputs)
    simulation/
      simulation.ts              deterministic Start/Next/Reset state machine (one step per stage)
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

- Levels 2–4 (Containers, Components, Code) — tabs exist but are disabled.
- Multiple/real scenarios, a full lifecycle simulator, and decision branching.
- Instructor-specific views, progress persistence, and i18n.
- Any live integration with external MLOps tooling.
