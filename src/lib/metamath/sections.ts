import type { SectionNode } from "./types";
import type { Heading, LabelStatementPos } from "./comments";
import { offsetToLine } from "./comments";

interface StackFrame {
  node: SectionNode;
  level: 1 | 2;
}

export interface SectionTreeResult {
  sections: SectionNode[];
  sectionPathByLabel: Map<string, string[]>;
}

function slugify(title: string, index: number): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "section"}-${index}`;
}

/**
 * Rebuilds the nested chapter/section table of contents from the flat list
 * of ASCII-banner headings, and records, for every labelled statement,
 * which section(s) it falls under.
 */
export function buildSectionTree(
  headings: Heading[],
  labelPositions: LabelStatementPos[],
  newlineOffsets: number[],
): SectionTreeResult {
  const roots: SectionNode[] = [];
  const stack: StackFrame[] = [];
  const sectionPathByLabel = new Map<string, string[]>();

  const sortedHeadings = [...headings].sort((a, b) => a.offset - b.offset);
  const sortedLabels = [...labelPositions].sort((a, b) => a.start - b.start);

  let headingIdx = 0;
  let labelIdx = 0;
  let counter = 0;

  const currentPath = () => stack.map((f) => f.node.title);
  const currentLabelsBucket = () =>
    stack.length > 0 ? stack[stack.length - 1].node.labels : null;

  while (headingIdx < sortedHeadings.length || labelIdx < sortedLabels.length) {
    const nextHeading = sortedHeadings[headingIdx];
    const nextLabel = sortedLabels[labelIdx];

    const takeHeading =
      nextHeading && (!nextLabel || nextHeading.offset <= nextLabel.start);

    if (takeHeading) {
      const heading = sortedHeadings[headingIdx++];
      while (
        stack.length > 0 &&
        stack[stack.length - 1].level >= heading.level
      ) {
        stack.pop();
      }
      const node: SectionNode = {
        id: slugify(heading.title, counter++),
        title: heading.title,
        level: heading.level,
        line: offsetToLine(newlineOffsets, heading.offset),
        children: [],
        labels: [],
      };
      const parent = stack[stack.length - 1]?.node;
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
      stack.push({ node, level: heading.level });
    } else if (nextLabel) {
      labelIdx++;
      sectionPathByLabel.set(nextLabel.label, currentPath());
      const bucket = currentLabelsBucket();
      if (bucket) bucket.push(nextLabel.label);
    }
  }

  return { sections: roots, sectionPathByLabel };
}
