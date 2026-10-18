import { OWN } from "./engine";

// Glass adds and removes layers on ordinary Vue elements. Checking only the mutation's target
// mistakes those additions for app changes and rescans the whole page, including layout reads.
export function needsScan(record: MutationRecord): boolean {
  if (
    record.target instanceof SVGElement ||
    (record.target instanceof Element && record.target.closest(`[${OWN}]`))
  ) {
    return false;
  }
  return [...record.addedNodes, ...record.removedNodes].some(
    (node) =>
      !(node instanceof SVGElement) &&
      !(node instanceof Element && node.hasAttribute(OWN))
  );
}
