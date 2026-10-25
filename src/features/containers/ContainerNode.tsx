import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { ContainerKind } from "./containerData";

export type ContainerFlowNode = Node<
  { name: string; responsibility: string; kind: ContainerKind },
  "container"
>;

const KIND_LABEL: Record<ContainerKind, string> = {
  service: "Service",
  store: "Data store",
  external: "External",
  handoff: "Handoff",
};

export function ContainerNode({ data, selected }: NodeProps<ContainerFlowNode>) {
  const classes = [
    "container-node",
    `container-node--${data.kind}`,
    selected ? "container-node--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <Handle id="t-left" type="target" position={Position.Left} className="context-handle" />
      <Handle id="t-right" type="target" position={Position.Right} className="context-handle" />
      <Handle id="t-top" type="target" position={Position.Top} className="context-handle" />
      <Handle id="t-bottom" type="target" position={Position.Bottom} className="context-handle" />
      <Handle id="s-left" type="source" position={Position.Left} className="context-handle" />
      <Handle id="s-right" type="source" position={Position.Right} className="context-handle" />
      <Handle id="s-top" type="source" position={Position.Top} className="context-handle" />
      <Handle id="s-bottom" type="source" position={Position.Bottom} className="context-handle" />
      <span className="container-node__kind">{KIND_LABEL[data.kind]}</span>
      <strong className="container-node__name">{data.name}</strong>
      <span className="container-node__resp">{data.responsibility}</span>
    </div>
  );
}
