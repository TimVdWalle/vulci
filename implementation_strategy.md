# Implementation Strategy

## Purpose

This document records the implementation decisions for the language
project.

It describes **how the language is implemented**, not the language
itself.

The language specification (syntax and semantics) remains independent of
any particular implementation.

------------------------------------------------------------------------

## Reference Implementation

The official reference implementation is written in **TypeScript** and
runs on **Node.js**.

This implementation is considered the primary implementation of the
language, not merely a prototype.

------------------------------------------------------------------------

## Interpreter Architecture

The initial implementation is a tree-walking interpreter.

Execution pipeline:

Source Code → Lexer → Parser → AST → Evaluator

The evaluator walks the AST directly and executes the program.

No bytecode is generated.

------------------------------------------------------------------------

## Runtime

The implementation relies on Node.js for:

-   Process execution
-   Memory allocation
-   Garbage collection
-   File system access
-   Operating system integration

The interpreter itself is responsible only for implementing the language
semantics.

------------------------------------------------------------------------

## Distribution

The official command-line interface is:

    mylang <source-file>

Production releases should be distributed as a standalone executable so
users are not be required to install Node.js.

The command-line interface is considered part of the language experience
and should remain stable regardless of implementation changes.

------------------------------------------------------------------------

## Performance Philosophy

The project prioritizes:

-   Correct language semantics
-   Simplicity of implementation
-   Fast iteration
-   Ease of experimentation

Premature runtime optimization is intentionally avoided.

Performance improvements should only be pursued when justified by real
usage and measurement.

------------------------------------------------------------------------

## Future Implementations

The language specification is independent of its implementation.

Future implementations may be written in other languages (for example C,
Rust or Go).

Such implementations should preserve the same language specification and
user-facing interface.

Changing the implementation must not require changes to user programs or
the command-line interface.

------------------------------------------------------------------------

## Rationale

Choosing TypeScript allows the project to focus on designing the
language rather than implementing low-level runtime infrastructure.

This significantly reduces implementation complexity while keeping all
future implementation options open.

If a native implementation ever becomes desirable, it should be
developed as an additional implementation of the language specification
rather than by automatically translating the TypeScript source.
