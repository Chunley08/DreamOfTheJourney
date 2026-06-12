// ============================================================
//  PERSONAS REGISTRY
//  Gathers every character's file into one map that comment.js
//  looks up by character name. Each character now contributes:
//    key      - lowercase name (the lookup id)
//    name     - display name (how the engine refers to them)
//    persona  - the personality / instruction text
//    blocking - that character's OWN hard-lines for when they block
//
//  >>> TO ADD A NEW CHARACTER:
//      1. Create personas/<name>.js  (copy shane.js as a template)
//      2. Add an import line below
//      3. Add it to the register(...) call below
//  comment.js never needs to change.
// ============================================================

import * as scorch from "./scorch.js";
import * as shane from "./shane.js";
import * as rory from "./rory.js";
import * as kayla from "./kayla.js";
// import * as cody from "./cody.js";        // <-- example: next character

// Build { scorch: { name, persona, blocking }, shane: {...}, ... }
function register(...modules) {
  const map = {};
  for (const m of modules) {
    if (!m || !m.key || !m.persona) continue;
    const key = String(m.key).toLowerCase().trim();
    map[key] = {
      name: m.name || (key.charAt(0).toUpperCase() + key.slice(1)),
      persona: m.persona,
      blocking: m.blocking || "",
      statusThemes: m.statusThemes || "",
      votingStyle: m.votingStyle || "",
    };
  }
  return map;
}

export const personas = register(
  scorch,
  shane,
  rory,
  kayla,
  // cody,                                   // <-- and list it here
);
