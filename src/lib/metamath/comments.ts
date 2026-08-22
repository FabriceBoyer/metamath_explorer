/**
 * Lightweight, regex-based extraction of Metamath *documentation* —
 * comments, section banners and their association with nearby labelled
 * statements.
 *
 * This intentionally does NOT parse the Metamath grammar: statement
 * structure, scoping and proof semantics all come from the vendored
 * parser/engine (see src/vendor/metamath-js). Comments are not part of the
 * formal language (verifiers ignore them), so decoding the set.mm authoring
 * conventions around them — a description right before a label, ASCII-art
 * banners as section headers — is a documentation-layer concern, kept
 * separate on purpose.
 *
 * The comment regex below is copied verbatim from
 * vendor/metamath-js/lexer.js's `comment` token so this stays in lockstep
 * with what the real tokenizer considers a comment.
 */

const COMMENT_RE = /\$\([\s]+(?:(?!\$\))[\s\S])*\$\)/g;
const LABEL_STATEMENT_RE = /([!-#%-~?]+)[ \t\r\n]+\$([aefp])(?=[\s])/g;

export interface RawComment {
  start: number;
  end: number;
  /** Comment body with the `$(`/`$)` delimiters stripped, untrimmed. */
  inner: string;
}

export interface LabelStatementPos {
  label: string;
  token: "f" | "e" | "a" | "p";
  start: number;
}

export interface Heading {
  offset: number;
  level: 1 | 2;
  title: string;
}

export function extractComments(src: string): RawComment[] {
  const comments: RawComment[] = [];
  COMMENT_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = COMMENT_RE.exec(src))) {
    const start = match.index;
    const end = start + match[0].length;
    comments.push({ start, end, inner: match[0].slice(2, -2) });
  }
  return comments;
}

/**
 * Finds every `<label> $f|$e|$a|$p` occurrence that lies outside of a
 * comment span, so that documentation examples such as
 * `<label> $a ... $. - Axiom or definition` (which literally appears in
 * set.mm's own intro comment) are not mistaken for real statements.
 */
export function findLabelStatementPositions(
  src: string,
  comments: RawComment[],
): LabelStatementPos[] {
  const sorted = [...comments].sort((a, b) => a.start - b.start);
  const positions: LabelStatementPos[] = [];

  let cursor = 0;
  const scanSegment = (from: number, to: number) => {
    const segment = src.slice(from, to);
    LABEL_STATEMENT_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = LABEL_STATEMENT_RE.exec(segment))) {
      positions.push({
        label: match[1],
        token: match[2] as "f" | "e" | "a" | "p",
        start: from + match.index,
      });
    }
  };

  for (const comment of sorted) {
    scanSegment(cursor, comment.start);
    cursor = comment.end;
  }
  scanSegment(cursor, src.length);

  positions.sort((a, b) => a.start - b.start);
  return positions;
}

const HEADING_CHARSETS: Array<{ level: 1 | 2; charset: RegExp }> = [
  { level: 1, charset: /^[#*]{20,}$/ },
  { level: 2, charset: /^[=-]{20,}$/ },
];

/** Classifies a comment's inner text as a section banner, if it matches
 * set.mm's decorative header convention (a line of repeated symbols, a
 * title line, then the same decoration again). Returns null otherwise. */
export function classifyHeading(inner: string): Omit<Heading, "offset"> | null {
  const lines = inner
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l !== "!");

  for (let i = 0; i + 2 < lines.length + 1 && i < lines.length; i++) {
    const decor = lines[i];
    const title = lines[i + 1];
    const decorEnd = lines[i + 2];
    if (!decor || !title || !decorEnd) break;
    for (const { level, charset } of HEADING_CHARSETS) {
      if (
        charset.test(decor) &&
        charset.test(decorEnd) &&
        !charset.test(title)
      ) {
        return { level, title };
      }
    }
  }
  return null;
}

export function buildNewlineIndex(src: string): number[] {
  const offsets: number[] = [];
  for (let i = 0; i < src.length; i++) {
    if (src.charCodeAt(i) === 10) offsets.push(i);
  }
  return offsets;
}

/** 1-based line number for a character offset, via binary search over
 * precomputed newline positions. */
export function offsetToLine(newlineOffsets: number[], offset: number): number {
  let lo = 0;
  let hi = newlineOffsets.length - 1;
  let line = newlineOffsets.length + 1; // offset is after the last newline
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (newlineOffsets[mid] >= offset) {
      line = mid + 1;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }
  return line;
}

export interface DocAnnotations {
  descriptionByLabel: Map<string, string>;
  headings: Heading[];
}

/**
 * Associates each label statement with the comment that immediately
 * precedes it (only whitespace in between), and collects section banners
 * found anywhere in the file.
 */
export function extractDocAnnotations(
  src: string,
  labelPositions: LabelStatementPos[],
  comments: RawComment[],
): DocAnnotations {
  const descriptionByLabel = new Map<string, string>();
  const headings: Heading[] = [];

  const sortedComments = [...comments].sort((a, b) => a.start - b.start);
  let labelIdx = 0;

  for (const comment of sortedComments) {
    const heading = classifyHeading(comment.inner);
    if (heading) {
      headings.push({ offset: comment.start, ...heading });
      continue;
    }

    while (
      labelIdx < labelPositions.length &&
      labelPositions[labelIdx].start < comment.end
    ) {
      labelIdx++;
    }
    const next = labelPositions[labelIdx];
    if (!next) continue;

    const between = src.slice(comment.end, next.start);
    if (between.trim().length === 0) {
      descriptionByLabel.set(next.label, comment.inner.trim());
    }
  }

  return { descriptionByLabel, headings };
}
