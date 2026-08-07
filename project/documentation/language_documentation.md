<!-- Phase: Phase 13 struct truth-file reconciliation -->
<!-- Document ID: language-documentation -->
<!-- Version: 3 -->
<!-- Status: Supporting -->
<!-- Authority: User-facing explanation of the intended accepted Vulci language -->
<!-- Supersedes: language-documentation v2 -->

# Vulci Language Documentation

This document explains the intended accepted Vulci language through examples and
practical guidance. It is not authoritative; the syntax and semantics
specifications own the language decisions.

# Integer expressions

## Arithmetic operators

Vulci supports these binary integer arithmetic operators:

```text
+   addition
-   subtraction
*   multiplication
/   integer division
%   remainder
```

Unary `-` negates an integer expression:

```vulci
-5
-value
-(1 + 2)
```

Repeated negation must use parentheses:

```vulci
-(-5)
```

`--5` is not valid.

## Digit separators

Integer literals may contain a single underscore between digits:

```vulci
1_000
1_000_000
```

The lexer preserves the original literal text, including underscores. The
underscores are removed when the integer literal is parsed.

An underscore is not valid before the first digit, after the final digit, or
immediately beside another underscore:

```vulci
_100
100_
1__000
```

## Precedence

Operations are evaluated in this order:

1. Parenthesized expressions
2. Unary `-`
3. `*`, `/`, `%`
4. `+`, `-`

Example:

```vulci
1 + 2 * 3
```

is evaluated as:

```vulci
1 + (2 * 3)
```

Parentheses override the normal order:

```vulci
(1 + 2) * 3
```

Operators at the same precedence level are evaluated from left to right. Use
parentheses when they make the intended order clearer.

## Integer division

Integer division truncates toward zero:

```vulci
5 / 2    // 2
-5 / 2   // -2
5 / -2   // -2
```

Division by zero is a runtime error.

## Remainder

The remainder has the same sign as the value being divided unless the result
is zero:

```vulci
-5 % 2   // -1
5 % -2   // 1
-5 % -2  // -1
```

Remainder by zero is a runtime error.

## Integer types

Vulci has its own `Integer` value type. Arithmetic operators require `Integer`
operands and do not perform implicit type conversions. Successful arithmetic
operations produce an `Integer`.

A local variable's current type is inferred from the value assigned to it at
runtime.

# Compound values and named types

Vulci distinguishes four related constructs:

| Property           | Tuple | Anonymous object | Struct |           Class |
| ------------------ | ----: | ---------------: | -----: | --------------: |
| Named type         |    No |               No |    Yes |             Yes |
| Positional members |   Yes |               No |     No |              No |
| Named fields       |    No |              Yes |    Yes |             Yes |
| Value semantics    |   Yes |              Yes |    Yes |              No |
| Reference identity |    No |               No |     No |             Yes |
| Methods            |    No |               No |    Yes |             Yes |
| Inheritance        |    No |               No |     No |             Yes |
| Data-focused       |   Yes |              Yes |    Yes | Not necessarily |

Classes belong to a later implementation phase. Phases 11–13 introduce tuples,
anonymous objects, and structs.

## Tuples

```vulci
point = (10, 20)

print(point.0)
print(point.1)
```

A tuple is an anonymous, fixed-length positional value. Tuple assignment uses
value semantics.

## Anonymous objects

```vulci
user = object(
    name: "Tim",
    age: 30
)

print(user.name)
print(user.age)
```

An anonymous object is an anonymous, fixed-shape value with named fields.
Anonymous-object assignment uses value semantics. An anonymous object is not
implicitly compatible with a struct, even when their fields match.

## Structs

```vulci
struct User {
    str name
    int age

    fn display_name() returns str {
        self.name
    }
}

user = User(
    name: "Tim",
    age: 30
)

print(user.display_name())
```

A struct is a reusable named, data-focused value type. Struct declarations are
top-level and evaluate to `null`. The struct name is both its type name and its
constructor name; it cannot be reused as a built-in type, function, variable,
parameter, or another struct name.

Struct types may be used anywhere a type is accepted. Fields are mutable, member
names are unique across fields and methods, and struct assignment creates an
independent value. Struct construction uses named fields, validates its shape
before evaluating expressions, and evaluates omitted defaults separately for
each construction. Structs may declare methods, use a read-only `self` binding
whose fields remain mutable, and cannot inherit.

Struct equality requires the same declared struct type and recursively equal
fields. Direct or indirect recursive structs are valid only when every recursive
cycle contains an explicitly nullable field.

## Classes

```vulci
class Account {
    str owner
    int balance

    fn deposit(int amount) {
        self.balance = self.balance + amount
    }
}

account = Account(
    owner: "Tim",
    balance: 100
)
```

A class is a reusable named, identity-focused reference type. Class instances
have identity, use reference semantics, may declare methods, and may inherit.

## Delimiter responsibilities

```vulci
(10, 20)                // tuple
object(name: "Tim")     // anonymous object
User(name: "Tim")       // struct construction
Account(owner: "Tim")   // class construction
{ expression }          // executable block
```

Struct and class construction deliberately use the same syntax. The type
declaration determines whether assignment copies a value or shares an instance.

# Style Guide

These are non-syntax recommendations. They do not determine whether a program is
valid.

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

### Prefer parentheses for associativity clarity

Although binary arithmetic operators are left-associative, relying on
associativity for expressions with repeated operators is not recommended.
Use parentheses when they improve clarity.

Preferred:

```text
(20 / 5) / 2
```

### Parenthesize intentional assignment conditions

An assignment directly used as a condition is valid but produces a non-fatal
warning.

```text
if (ready = true) {
}
```

Adding an extra pair of parentheses explicitly marks the assignment as
intentional and suppresses the warning.

```text
if ((ready = true)) {
}
```
