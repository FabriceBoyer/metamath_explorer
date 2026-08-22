# Vendored code notice

The files `lexer.js`, `descent.js` and `engine.js` in this directory are
adapted from [google/metamath.js](https://github.com/google/metamath.js)
(archived), copyright 2022 Google LLC, licensed under the
[Apache License 2.0](./LICENSE).

Vendored from commit `b98044b6347dd73f589cea1a62b951ced568942c` (branch `main`).

Original file mapping:

| This directory | Upstream file     |
| -------------- | ----------------- |
| `lexer.js`     | `src/lexer.js`    |
| `descent.js`   | `src/descent.js`  |
| `engine.js`    | `src/metamath.js` |

## Changes made

The upstream project ships as CommonJS (`require`/`module.exports`) with a
`package.json` that is not designed to be consumed as an npm dependency (its
`install` lifecycle script shells out to a dev-only tool). Rather than
reinventing Metamath parsing/verification, we vendor the original algorithms
verbatim and only perform a mechanical module-syntax conversion:

- `require(...)` calls rewritten as ES `import` statements.
- `module.exports = {...}` rewritten as named `export`s.
- No changes to parsing, scoping, verification, or proof
  compression/decompression logic.

This project (metamath-explorer) does not reimplement the Metamath grammar,
scope/frame rules, or proof verification algorithm — all of that logic is
the upstream project's, reused here per the Apache License 2.0.
