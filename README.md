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

- **Header** with product name and purpose.
- **Four navigation tabs** mirroring C4 levels. Level 1 works; Levels 2–4 are
  labeled "planned" and disabled.
- **Level 1 System Context diagram** built with `@xyflow/react`:
  - *Learner* (primary actor) → *simulation-MLOps* → *Learner* relationships
  - *Instructor* (secondary actor) → *simulation-MLOps*
  - Fixed positions (guided, not an editor), pan/zoom, fit-to-view, Reset view.
  - Selecting any element shows a plain-language explanation in the detail panel.
- **Sample simulation**: Start begins a seeded scenario, Next steps through a
  few visible state changes (highlighted elements + status text), Reset
  restores the initial state. Fully deterministic — no timers or randomness.
- **Accessibility**: focusable diagram elements, real `<button>` controls, a
  `role="status"` live region for simulation status, and a full text/list
  alternative to the diagram. Responsive down to narrow screens.

## Project layout

```
src/
  App.tsx                        page shell: header, level tabs, simulation controls, layout
  index.css                      restrained global styles
  features/
    context/
      contextData.ts             C4 Level 1 elements + relationships (single source of truth)
      ContextDiagram.tsx         @xyflow/react diagram, selection, fit/reset view
      ContextNode.tsx            custom node renderer
      DetailPanel.tsx            explanation panel for the selected element
      ContextList.tsx            text alternative to the diagram
    simulation/
      simulation.ts              deterministic Start/Next/Reset state machine
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
