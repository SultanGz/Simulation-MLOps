import type { NodeProps, Node } from "@xyflow/react";

export type RegionFlowNode = Node<
  { title: string; subtitle: string },
  "region"
>;

/** Non-interactive labeled backdrop that orients a region of the canvas. */
export function RegionNode({ data }: NodeProps<RegionFlowNode>) {
  return (
    <div className="region">
      <div className="region__label">
        <strong>{data.title}</strong>
        <span>{data.subtitle}</span>
      </div>
    </div>
  );
}
