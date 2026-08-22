import { describe, expect, it } from "vitest";
import { classifyKind } from "./classify";

describe("classifyKind", () => {
  it("classifies floating and essential hypotheses", () => {
    expect(classifyKind("$f", "wff", "wph")).toBe("floating");
    expect(classifyKind("$e", "wff", "min")).toBe("hypothesis");
  });

  it("classifies theorems regardless of typecode", () => {
    expect(classifyKind("$p", "|-", "2p2e4")).toBe("theorem");
  });

  it("classifies syntax constructions (non |- typecode $a)", () => {
    expect(classifyKind("$a", "wff", "wn")).toBe("syntax");
  });

  it("classifies ax- and df- labelled |- axioms", () => {
    expect(classifyKind("$a", "|-", "ax-1")).toBe("axiom");
    expect(classifyKind("$a", "|-", "df-an")).toBe("definition");
    expect(classifyKind("$a", "|-", "something-else")).toBe("axiom");
  });
});
