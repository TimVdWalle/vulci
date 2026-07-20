# syntax_decisions_v2.md

# Purpose

This document is the single source of truth for syntax decisions that
have been **explicitly agreed**.

Only accepted decisions belong here. Anything not explicitly agreed is
considered undecided.

---

# Accepted syntax

## syn01 --- Blocks

Blocks use braces.

```text
if ... {
    ...
}
```

Reasoning: Simple and familiar.

---

## syn02 --- Variable creation

Variables are created by first assignment. No `let` or `var`.

```text
count = 1
count = 2
```

Reasoning: Reduce boilerplate.

---

## syn03 --- Scope

Functions create scopes.

Reasoning: Predictable lifetime.

---

## syn04 --- Control-flow scope

`if`, `for`, and similar control-flow constructs do **not** create
scopes.

Reasoning: Simpler mental model.

---

## syn05 --- Conditional existence

A variable exists only if execution reached its first assignment.

Reasoning: Scope follows execution.

---

## syn06 --- Functions

Functions use `fn`.

```text
fn add(a, b) {
}
```

---

## syn07 --- Returns

Both explicit and implicit returns are supported.

```text
fn max(a, b) {
    if a > b {
        return a
    }

    b
}
```

Reasoning: Explicit when needed, concise otherwise.

---

## syn08 --- Named arguments

Named arguments are supported.

```text
add(a: 1, b: 2)
```

---

## syn09 --- Positional calls

Functions with up to **two required parameters** may be called
positionally.

```text
fn add(a, b)

add(1, 2)
add(a: 1, b: 2)
```

Functions with three or more required parameters require named
arguments.

Reasoning: Keep common cases concise without reducing readability.

---

## syn10 --- Optional parameters

Optional parameters must always be passed by name.

```text
fn request(url, method, timeout = 30)

request("/users", "GET", timeout: 10)   # valid
request("/users", "GET", 10)            # invalid
```

Reasoning: Preserve clarity.

---

## syn11 --- Mixing positional and named

Once a named argument is used, every following argument must also be
named.

Valid:

```text
request("/users", "GET", timeout: 10)
```

Invalid:

```text
request("/users", method: "GET", 10)
request(url: "/users", "GET")
```

Reasoning: One simple universal rule.

---

## syn12 --- Named argument order

Named arguments may appear in any order.

```text
connect(port: 8080, host: "localhost")
```

Reasoning: Avoid unnecessary restrictions.

---

## syn13 --- Duplicate arguments

Each parameter may be supplied exactly once.

Invalid:

```text
connect(host: "a", host: "b")
connect("a", host: "b")
```

Reasoning: Eliminate ambiguity.

---

# Style guidance (non-language rules)

- Prefer either fully positional (when allowed) or fully named calls.
- Mixed calls are valid but should be used sparingly.

---

# Explicitly undecided

Everything not listed above, including:

- Parentheses around conditions
- Exact if/else syntax
- Loop syntax
- Lambdas
- Classes/objects
- Generics
- Imports/modules
- Comments
- Statement separators
- Trailing commas
- Operator precedence
