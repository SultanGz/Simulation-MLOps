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
page. Everything lives on one curated spatial workspace organized around one
labeled system boundary:

- **simulation-MLOps boundary** — the system itself. Inside it, the eight
  provider-neutral lifecycle stages run as a numbered, connected serpentine:
  stages 1–4 left-to-right, a turn downward, then 5–8 right-to-left.
- **Actors outside the boundary** — *Learner* and *Instructor* sit in a column
  on the left with labeled relationship arrows to and from the boundary.
- **Inline stage details** — selecting a stage attaches a detail card node on
  the canvas (connected to the stage) showing what it does plus its labeled
  Input and Output. Only the selected stage expands.

Screen-fixed overlays (they do not scroll or drift with the canvas):

- **Header HUD**: name, one-line purpose, C4 level tabs (Level 1 active;
  2–4 planned/disabled), theme toggle.
- **Toolbar HUD**: Start / Next / Reset and a "Stage N of 8" progress chip.
- **Inspector HUD**: concise read-out for the selected person, system, or
  relationship (stage I/O lives on the canvas, not here). The full element
  list stays behind a collapsed "Canvas contents" disclosure as the text
  alternative.

Canvas behavior:

- Pan/zoom freely, zoom controls, mini-map, fit-to-view, Reset view.
- Clicking a person, system, relationship, or stage updates the inspector —
  without changing simulation progress.
- Start begins the seeded scenario; Next advances one stage, highlights it,
  and glides the camera to it; Reset returns the simulation and camera to the
  composed overview. Fully deterministic — no timers or randomness.
- **Dark theme**: light by default, header toggle; the canvas follows via
  `colorMode`.

## Project layout

```
src/
  App.tsx                        app shell: canvas + HUD overlays (header, toolbar, inspector)
  index.css                      theme variables + node/region/HUD styles
  features/
    canvas/
      WorkspaceCanvas.tsx        React Flow canvas: boundary, nodes, edges, camera control
      StageNode.tsx              compact lifecycle stage node
      StageDetailNode.tsx        inline Input/Output card attached to the selected stage
      RegionNode.tsx             the single "simulation-MLOps" system boundary
    context/
      contextData.ts             C4 Level 1 elements + relationships (single source of truth)
      ContextNode.tsx            person/system node renderer
      DetailPanel.tsx            fixed inspector panel (elements + stages) + text alternative
      ContextList.tsx            accessible list of every canvas element
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
