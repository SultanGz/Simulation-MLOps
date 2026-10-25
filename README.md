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
- **Level 1 System Context diagram** built with `@xyflow/react`, as the visual
  focus of the page:
  - *Learner* (primary actor) → *simulation-MLOps* → *Learner* relationships
  - *Instructor* (secondary actor) → *simulation-MLOps*
  - Fixed positions (guided, not an editor), pan/zoom, fit-to-view, Reset view.
  - Parallel edges are offset so relationship labels never overlap.
- **Lifecycle section** (full width, below the diagram): all eight stages as a
  numbered, connected sequence — Define → Acquire → Prepare → Train → Evaluate →
  Register/package/test → Deploy → Monitor/respond. Completed, current, and
  upcoming stages are visually distinct; on narrow screens it becomes a
  vertical timeline.
- **Stage detail area**: shows the selected stage's one-line summary plus
  structured Input and Output. Inspecting a stage never advances the
  simulation — it defaults to stage 1, or follows the active stage while the
  simulation runs.
- **Concise detail panel**: the simulation-MLOps system is selected by default;
  selecting any person, system, or relationship swaps in a short explanation.
- **Sample simulation**: Start begins a seeded scenario and Next steps through
  the eight lifecycle stages in order, highlighting the active stage (the
  context diagram itself stays a context view — it is not rearranged into a
  process flow). A "Stage N of 8 / Complete" progress label tracks position;
  Reset restores the idle state. Fully deterministic — no timers or randomness.
- **Dark theme**: light by default, with a header toggle (the diagram follows
  the theme via `@xyflow/react`'s `colorMode`).
- **Accessibility**: focusable diagram elements, real `<button>` controls, a
  `role="status"` live region, and the full element list behind a collapsed
  "Diagram contents" disclosure. Responsive down to narrow screens.

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
    lifecycle/
      lifecycleData.ts           the eight provider-neutral lifecycle stages (inputs/outputs)
      LifecycleSection.tsx       selectable stage cards; highlights the active stage
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
