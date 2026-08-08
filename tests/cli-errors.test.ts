// Phase 14

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import path from "node:path";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const cases = [
  {
    name: "unknown string member",
    fixture: "unknown-string-member.vci",
    expected: "E_MEM_UNKNOWN: Unknown string member 'missing'. at 3:9",
  },
  {
    name: "wrong string member argument count",
    fixture: "wrong-string-member-argument-count.vci",
    expected:
      "E_ARG_COUNT: Member 'count' expects 0 arguments, but received 1. at 3:9",
  },
  {
    name: "wrong string member argument type",
    fixture: "wrong-string-member-argument-type.vci",
    expected: "E_ARG_TYPE: Member 'contains' expects a str argument. at 3:9",
  },
  {
    name: "unknown enum member",
    fixture: "unknown-enum-member.vci",
    expected: "E_MEM_UNKNOWN: Enum 'Status' has no member 'Missing'. at 5:8",
  },
] as const;

for (const testCase of cases) {
  test(`CLI reports ${testCase.name} without a stack trace`, () => {
    const fixturePath = path.join(
      projectRoot,
      "tests",
      "fixtures",
      "cli-errors",
      testCase.fixture,
    );

    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", "src/cli.ts", fixturePath],
      {
        cwd: projectRoot,
        encoding: "utf8",
      },
    );

    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr.trim(), testCase.expected);
    assert.doesNotMatch(result.stderr, /\n\s+at\s/);
  });
}
