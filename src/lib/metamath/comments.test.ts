import { describe, expect, it } from "vitest";
import {
  extractComments,
  findLabelStatementPositions,
  classifyHeading,
  extractDocAnnotations,
  buildNewlineIndex,
  offsetToLine,
} from "./comments";

describe("extractComments", () => {
  it("finds every $( ... $) span", () => {
    const src = "$( first $) x $f wff x $. $( second\nmultiline $)";
    const comments = extractComments(src);
    expect(comments).toHaveLength(2);
    expect(comments[0].inner.trim()).toBe("first");
    expect(comments[1].inner.trim()).toBe("second\nmultiline");
  });
});

describe("findLabelStatementPositions", () => {
  it("finds real statements outside comments", () => {
    const src = "wph $f wff ph $.\nax-1 $a |- ph $.";
    const comments = extractComments(src);
    const positions = findLabelStatementPositions(src, comments);
    expect(positions.map((p) => p.label)).toEqual(["wph", "ax-1"]);
    expect(positions.map((p) => p.token)).toEqual(["f", "a"]);
  });

  it("ignores statement-shaped text that lives inside a comment", () => {
    // This mirrors set.mm's own intro comment, which documents the syntax
    // using literal examples like "<label> $a ... $." — these must not be
    // mistaken for a real $a statement.
    const src =
      "$( Syntax summary:\n  <label> $a ... $. - Axiom or definition\n$)\nwph $f wff ph $.";
    const comments = extractComments(src);
    const positions = findLabelStatementPositions(src, comments);
    expect(positions).toHaveLength(1);
    expect(positions[0].label).toBe("wph");
  });
});

describe("classifyHeading", () => {
  it("recognizes a level-1 banner (chapter/part)", () => {
    const inner = `
#*#*#*#*#*#*#*#*#*#*#*#*#*#*#*#*#*#*#*#*#*#*#*
  Propositional calculus
#*#*#*#*#*#*#*#*#*#*#*#*#*#*#*#*#*#*#*#*#*#*#*
`;
    expect(classifyHeading(inner)).toEqual({
      level: 1,
      title: "Propositional calculus",
    });
  });

  it("recognizes a level-2 banner (section)", () => {
    const inner = `
=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  Recursively define primitive wffs
=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
`;
    expect(classifyHeading(inner)).toEqual({
      level: 2,
      title: "Recursively define primitive wffs",
    });
  });

  it("returns null for an ordinary documentation comment", () => {
    expect(
      classifyHeading("Just a regular description of a theorem."),
    ).toBeNull();
  });
});

describe("extractDocAnnotations", () => {
  it("attaches a comment only to the label it immediately precedes", () => {
    const src = [
      "$( Description of wn. $)",
      "wn $a wff -. ph $.",
      "$( Not attached to anything, followed by a section header. $)",
    ].join("\n");
    const comments = extractComments(src);
    const positions = findLabelStatementPositions(src, comments);
    const { descriptionByLabel } = extractDocAnnotations(
      src,
      positions,
      comments,
    );
    expect(descriptionByLabel.get("wn")).toBe("Description of wn.");
  });

  it("does not attach a comment separated from the label by other content", () => {
    const src = "$( unrelated $)\nsome text $. wn $a wff -. ph $.";
    const comments = extractComments(src);
    const positions = findLabelStatementPositions(src, comments);
    const { descriptionByLabel } = extractDocAnnotations(
      src,
      positions,
      comments,
    );
    expect(descriptionByLabel.has("wn")).toBe(false);
  });
});

describe("offsetToLine", () => {
  it("computes 1-based line numbers", () => {
    const src = "aaa\nbbb\nccc";
    const newlines = buildNewlineIndex(src);
    expect(offsetToLine(newlines, 0)).toBe(1);
    expect(offsetToLine(newlines, 4)).toBe(2);
    expect(offsetToLine(newlines, 8)).toBe(3);
  });
});
