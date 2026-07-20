# Programming Language Syntax Specification

## Source of Truth -- Accepted Syntax (v3)

**Purpose**

This document is the authoritative source for every accepted syntax
decision.

Only syntax that has been explicitly accepted belongs in the language.
Anything listed as **On Hold** or **Undecided** is **not** part of the
language.

---

# 1. Program Structure

## Entry Point

### Decision

Execution starts at the top level of the source file.

### Rationale

Avoid mandatory boilerplate for simple programs.

### Example

```text
print("Hello")
start
```

No `fn main` exists.

---

# 2. Statements

## Statement Terminator

### Decision

Statements end at a newline.

Semicolons are not allowed.

### Valid

```text
x = 1
y = 2
print(x)
```

### Invalid

```text
x = 1;
```

---

# 3. Comments

Single-line:

```text
// comment
```

Multi-line:

```text
/*
comment
*/
```

Reason: keeps `#` available for possible future language features.

---

# 4. Literals

## Boolean

```text
true
false
```

## String

Single-line strings use double quotes.

```text
name = "Alice"
```

Single quotes are not used for strings.

### Escape Sequences

Supported:

```text
\n
\t
\r
\\
\"
```

Example:

```text
text = "Hello\nWorld"
```

### Multiline Strings

Use triple double quotes.

```text
text = \"\"\"
Hello
World
\"\"\"
```

Reason: Keeps multiline strings visually distinct.

## Numbers

Currently supported:

- Decimal integers
- Decimal floating point

Digit separators are allowed.

```text
1_000
1_000_000
3.141_592
```

Not currently supported:

- Hexadecimal
- Binary
- Octal
- Scientific notation

---

# 5. Operators

## Comparison

```text
==
!=
<
<=
>
>=
```

## Logical

```text
and
or
not
```

Reason: Keyword operators improve readability.

---

# 6. Function Calls

## Zero-argument Calls

Parentheses may be omitted.

Valid:

```text
start
exit
```

## Calls With Arguments

Parentheses are required.

```text
print("Hello")
resize(image, width=100)
```

Invalid:

```text
print "Hello"
```

## Member Access

Uses `.`

```text
user.name
user.address.city
```

Function reference syntax is still undecided.

---

# 7. Parameters & Arguments

## Rules

- Named arguments are the default.
- Up to the first **two required** parameters may be supplied
  positionally.
- Optional parameters must always be named.
- Named arguments may appear in any order.
- Once a named argument is used, every following argument must also be
  named.
- Supplying the same parameter twice is invalid.

### Valid

```text
resize(image, 100, height=200)
resize(image, height=200, width=100)
```

### Invalid

```text
resize(image, height=200, 100)
resize(image, width=100, width=200)
```

Reason: Names improve readability once calls become larger.

---

# 8. Control Flow

## Conditions

Parentheses are required.

```text
if (ready) {
}

while (running) {
}
```

## Else-if

```text
if (...) {
}
else if (...) {
}
else {
}
```

---

# 9. Functions

## Implicit Return

The final evaluated expression becomes the return value.

```text
fn add(a, b) {
    a + b
}
```

## Explicit Return

Allowed anywhere.

Primarily intended for early exits.

```text
fn process(data) {
    if (invalid(data)) {
        return null
    }

    compute(data)
}
```

There is no `noop` keyword.

When an implicit return of `null` is desired, use `null` as the final
expression.

---

# 10. Imports

Import keyword:

```text
import math
```

---

# 11. Formatting Rules

Trailing commas are allowed.

```text
[
    1,
    2,
    3,
]
```

---

# 12. Style Guide (Non-syntax)

These are recommendations only.

### Prefer implicit return

Preferred:

```text
fn add(a, b) {
    a + b
}
```

Allowed but discouraged:

```text
fn add(a, b) {
    return a + b
}
```

Use explicit `return` mainly for guard clauses and early exits.

---

# 13. On Hold

- Compound assignment (`+=`, etc.)
- Loop syntax
- Match / switch syntax
- Lambda syntax
- Generic syntax
- Error handling syntax
- Attributes / annotations
- Visibility syntax
- Hexadecimal literals
- Binary literals
- Octal literals
- Scientific notation
- String interpolation

These are intentionally postponed and are **not** part of the language.

---

# 14. Undecided

- Function references
- Collection syntax
- Object syntax
- Type syntax
- Enum syntax
- Class syntax
- Module/package syntax

---

# Scope

This document contains only accepted syntax decisions from the design
discussions. Future accepted syntax should be added here. Existing
accepted decisions must not be modified without an explicit design
decision.
