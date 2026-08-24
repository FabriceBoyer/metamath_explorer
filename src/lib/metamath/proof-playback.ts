import type { VerifiedProofStep } from "./types";

export interface StackItem {
  id: number;
  typecode: string;
  expression: string[];
  fromStep: number;
}

/**
 * Replays a fully-resolved (exploded, marker-free) proof step by step and
 * returns the stack contents after each step — `stacks[0]` is empty,
 * `stacks[i]` is the stack after applying `steps[0..i-1]`. Shared by the
 * toy pedagogical stepper and the real-theorem proof player so both
 * visualize the exact same stack-machine semantics.
 */
export function replayStacks(steps: VerifiedProofStep[]): StackItem[][] {
  const stacks: StackItem[][] = [[]];
  let current: StackItem[] = [];
  let uid = 0;

  steps.forEach((step, i) => {
    const popCount = step.args.length;
    current = current.slice(0, current.length - popCount);
    current = [
      ...current,
      {
        id: uid++,
        typecode: step.typecode,
        expression: step.expression,
        fromStep: i,
      },
    ];
    stacks.push(current);
  });

  return stacks;
}
