/**
 * C4 Level 1 (System Context) data for simulation-MLOps.
 *
 * Two kinds of elements share one id space so a single "selected element"
 * can drive both the diagram highlight and the detail panel:
 *  - nodes: actors (people) and the system itself
 *  - edges: labeled relationships between them
 */

export type ElementKind = "Person" | "Software System" | "Relationship";

export interface ContextNode {
  id: string;
  kind: Exclude<ElementKind, "Relationship">;
  name: string;
  /** One-line label under the name in the diagram. */
  tagline: string;
  /** Plain-language explanation for the detail panel. */
  description: string;
}

export interface ContextRelationship {
  id: string;
  kind: "Relationship";
  source: string;
  target: string;
  /** Short label rendered on the edge. */
  label: string;
  description: string;
}

export const contextNodes: ContextNode[] = [
  {
    id: "learner",
    kind: "Person",
    name: "Learner",
    tagline: "Primary actor",
    description:
      "A person learning the MLOps lifecycle. The Learner picks a bundled sample scenario, explores the diagram, makes lifecycle decisions, and sees simulated outcomes with plain-language explanations. No account or credentials are needed.",
  },
  {
    id: "system",
    kind: "Software System",
    name: "simulation-MLOps",
    tagline: "This website — the system boundary",
    description:
      "An interactive website for learning the MLOps lifecycle through guided simulations. Everything inside this boundary — the scenario state, lifecycle stages, and explanations — runs in the browser using bundled sample data. It does not connect to real data sources, CI pipelines, experiment trackers, model registries, deployment runtimes, or monitoring services.",
  },
  {
    id: "instructor",
    kind: "Person",
    name: "Instructor",
    tagline: "Secondary actor",
    description:
      "A person facilitating a walkthrough, for example in a class or workshop. The Instructor opens the same view the Learner sees and guides the group through the scenario — this milestone has no separate instructor interface.",
  },
];

export const contextRelationships: ContextRelationship[] = [
  {
    id: "learner-selects",
    kind: "Relationship",
    source: "learner",
    target: "system",
    label: "Selects scenario · advances simulation",
    description:
      "The Learner drives the session: choosing a scenario, clicking around the lifecycle context, and stepping the simulation forward through decision points.",
  },
  {
    id: "system-explains",
    kind: "Relationship",
    source: "system",
    target: "learner",
    label: "Shows state · outcomes · explanations",
    description:
      "In return, the website presents the current lifecycle state, the simulated result of each decision, and plain-language explanations — all generated locally from the sample scenario.",
  },
  {
    id: "instructor-facilitates",
    kind: "Relationship",
    source: "instructor",
    target: "system",
    label: "Facilitates a walkthrough",
    description:
      "The Instructor uses the same interactive view to present a scenario to a group, stepping through the same deterministic simulation states.",
  },
];

export type ContextElement = ContextNode | ContextRelationship;

export function getElement(id: string): ContextElement | undefined {
  return (
    contextNodes.find((n) => n.id === id) ??
    contextRelationships.find((r) => r.id === id)
  );
}
