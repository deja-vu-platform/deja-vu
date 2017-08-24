import {SourceAtom, TargetAtom} from "./data";

export function doesFollow(source: SourceAtom, target: TargetAtom): boolean {
  return !!source.follows.filter(t => t.atom_id === target.atom_id).length;
}
