// Minimal golden file testing: results are stored as JSON next to the fixtures,
// so any change of behavior shows up as a reviewable diff.
// Run `UPDATE_GOLDEN=1 npm test` to (re)write the files.

import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

export function expectGolden(file, value) {
  const actual = `${JSON.stringify(value, null, 2)}\n`;

  if (process.env.UPDATE_GOLDEN) {
    writeFileSync(file, actual);
    return;
  }

  assert.ok(
    existsSync(file),
    `Missing golden file ${file} – run \`UPDATE_GOLDEN=1 npm test\` to create it`
  );

  assert.equal(actual, readFileSync(file, "utf8"));
}
