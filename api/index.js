// ============================================================
//  PERSONAS REGISTRY
//  This file gathers every character's persona file into one object
//  that comment.js looks up by character name.
//
//  >>> TO ADD A NEW CHARACTER (the ONLY place you wire one in):
//      1. Create personas/<name>.js  (copy shane.js as a template)
//      2. Add an import line below
//      3. Add it to the register(...) call below
//  comment.js never needs to change.
// ============================================================

import * as scorch from "./scorch.js";
import * as shane from "./shane.js";
// import * as cody from "./cody.js";        // <-- example: next character
// import * as rory from "./rory.js";

// Build the { "scorch": "persona text", "shane": "persona text", ... } map.
// Each persona file exports `key` (lowercase name) and `persona` (the text).
function register(...modules) {
  const map = {};
  for (const m of modules) {
    if (!m || !m.key || !m.persona) continue;
    map[String(m.key).toLowerCase().trim()] = m.persona;
  }
  return map;
}

export const personas = register(
  scorch,
  shane,
  // cody,                                   // <-- and list it here
  // rory,
);
