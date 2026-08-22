/**
 *  Copyright 2022 Google LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 **/

// Vendored from google/metamath.js src/lexer.js — see NOTICE.md.
// Only change: CommonJS require/module.exports converted to ES import/export.

import moo from "moo";

export const lexicon = {
  comment: { match: /\$\([\s]+(?:(?!\$\))[\s\S])*\$\)/, lineBreaks: true },
  lfile: "$[",
  rfile: "$]",
  v: "$v",
  d: "$d",
  c: "$c",
  f: "$f",
  a: "$a",
  e: "$e",
  p: "$p",
  proof: "$=",
  dot: "$.",
  lscope: "${",
  rscope: "$}",
  ws: { match: /[\s]+/, lineBreaks: true },
  sequence: /[!-#%-~\?]+/,
};

export const lexer = moo.compile(lexicon);
