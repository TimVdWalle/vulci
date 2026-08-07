// Phase 14

import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateEnumSource as evaluate,
  evaluateEnumSourceWithBuiltins as evaluateWithBuiltins,
} from "./enum-test-helpers.ts";

test("enum declarations evaluate to null", () => {
  assert.deepEqual(evaluate("enum Status {\n  Pending\n}"), {
    type: "Null",
  });
});

test("resolves enum values before their textual declaration", () => {
  assert.deepEqual(
    evaluate(`value = Status.Pending
enum Status {
  Pending
  Running
}
value`),
    { type: "Enum", enumName: "Status", memberName: "Pending" },
  );
});

test("preserves enum identity across assignment and copying", () => {
  assert.deepEqual(
    evaluate(`enum Status {
  Pending
  Running
}
first = Status.Pending
second = first
first = Status.Running
second`),
    { type: "Enum", enumName: "Status", memberName: "Pending" },
  );
});

test("compares enum values by declaring type and member", () => {
  assert.deepEqual(
    evaluate(`enum Status {
  Pending
  Running
}
Status.Pending == Status.Pending`),
    { type: "Boolean", value: true },
  );
  assert.deepEqual(
    evaluate(`enum Status {
  Pending
  Running
}
Status.Pending != Status.Running`),
    { type: "Boolean", value: true },
  );
  assert.deepEqual(
    evaluate(`enum First {
  Pending
}
enum Second {
  Pending
}
First.Pending == Second.Pending`),
    { type: "Boolean", value: false },
  );
});

test("supports enum equality chains", () => {
  assert.deepEqual(
    evaluate(`enum Status {
  Pending
  Running
}
Status.Pending == Status.Pending != Status.Running`),
    { type: "Boolean", value: true },
  );
});

test("uses enum values in function and struct defaults", () => {
  assert.deepEqual(
    evaluate(`fn current(Status value = Status.Pending) returns Status {
  value
}
struct Job {
  Status status = Status.Running
}
enum Status {
  Pending
  Running
}
(current(), Job().status)`),
    {
      type: "Tuple",
      members: [
        { type: "Enum", enumName: "Status", memberName: "Pending" },
        { type: "Enum", enumName: "Status", memberName: "Running" },
      ],
    },
  );
});

test("validates enum types in struct methods", () => {
  assert.deepEqual(
    evaluate(`struct Job {
  Status status
  fn update(Status value) returns Status {
    self.status = value
    self.status
  }
}
enum Status {
  Pending
  Running
}
Job(status: Status.Pending).update(Status.Running)`),
    { type: "Enum", enumName: "Status", memberName: "Running" },
  );
});

test("stores enum values in typed struct fields", () => {
  assert.deepEqual(
    evaluate(`struct Job {
  Status status
}
enum Status {
  Pending
}
Job(status: Status.Pending).status`),
    { type: "Enum", enumName: "Status", memberName: "Pending" },
  );
});

test("supports enum values inside tuples", () => {
  assert.deepEqual(
    evaluate(`fn pair(Status value) returns tuple(Status, int) {
  (value, 14)
}
enum Status {
  Pending
}
pair(Status.Pending)[0]`),
    { type: "Enum", enumName: "Status", memberName: "Pending" },
  );
});

test("prints qualified enum values", () => {
  const output: string[] = [];
  const originalLog = console.log;
  console.log = (...values: unknown[]) => {
    output.push(values.map(String).join(" "));
  };

  try {
    evaluateWithBuiltins(`enum Status {
  Pending
}
print(value: Status.Pending)`);
  } finally {
    console.log = originalLog;
  }

  assert.deepEqual(output, ["Status.Pending"]);
});

test("interpolates only the enum member name", () => {
  assert.deepEqual(
    evaluate(`enum OrderStatus {
  PendingApproval
}
"status={{OrderStatus.PendingApproval}}"`),
    { type: "String", value: "status=PendingApproval" },
  );
});
