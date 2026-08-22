import { describe, expect, it } from "vitest";
import { buildSectionTree } from "./sections";
import type { Heading, LabelStatementPos } from "./comments";

function h(offset: number, level: 1 | 2, title: string): Heading {
  return { offset, level, title };
}
function l(offset: number, label: string): LabelStatementPos {
  return { label, token: "a", start: offset };
}

describe("buildSectionTree", () => {
  it("nests level-2 sections under the preceding level-1 part", () => {
    const headings = [
      h(0, 1, "Part A"),
      h(10, 2, "Section A.1"),
      h(30, 2, "Section A.2"),
    ];
    const labels = [l(15, "thm1"), l(35, "thm2")];
    const { sections, sectionPathByLabel } = buildSectionTree(
      headings,
      labels,
      [],
    );

    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe("Part A");
    expect(sections[0].children.map((c) => c.title)).toEqual([
      "Section A.1",
      "Section A.2",
    ]);
    expect(sectionPathByLabel.get("thm1")).toEqual(["Part A", "Section A.1"]);
    expect(sectionPathByLabel.get("thm2")).toEqual(["Part A", "Section A.2"]);
  });

  it("starts a new sibling part when another level-1 heading appears", () => {
    const headings = [
      h(0, 1, "Part A"),
      h(10, 2, "Section A.1"),
      h(20, 1, "Part B"),
    ];
    const labels = [l(30, "thm")];
    const { sections, sectionPathByLabel } = buildSectionTree(
      headings,
      labels,
      [],
    );

    expect(sections.map((s) => s.title)).toEqual(["Part A", "Part B"]);
    expect(sectionPathByLabel.get("thm")).toEqual(["Part B"]);
  });

  it("leaves statements with no preceding heading out of any section", () => {
    const labels = [l(0, "thm")];
    const { sectionPathByLabel } = buildSectionTree([], labels, []);
    expect(sectionPathByLabel.get("thm")).toEqual([]);
  });
});
