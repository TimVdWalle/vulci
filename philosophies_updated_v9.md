# Philosophies

This document contains the guiding principles for the language. Every significant language feature should support one or more of these philosophies.

---

## phi1 — One mental model for working with data.

Developers should only need to learn one way to work with data.

One mental model for working with data, regardless of its representation, source, or shape.

Regardless of whether data comes from memory, files, databases, APIs, streams, or other sources, it should be accessed, navigated, filtered, transformed, queried, and combined through the same mental model and the same core operations.

Differences between data sources should be expressed through explicit characteristics rather than different APIs or programming models. The programmer should adapt to a collection's characteristics, not relearn how to work with it.


## phi2 — Code should be easy to read, understand, and interpret unambiguously.

Developers spend more time reading code than writing it. Favor language features that improve clarity, consistency, and intent over cleverness or brevity.

Prefer explicitness over implicitness, avoiding hidden behavior and surprising language constructs whenever practical. Every construct should have one clear interpretation. If different readers can reasonably interpret it differently, the construct should not exist in the language.

---

## phi3 — Use a limited set of language building blocks that become powerful when combined.

The language should provide a small number of fundamental concepts that are easy to learn and reason about. Complex solutions should emerge from combining these building blocks consistently, rather than by introducing many specialized language features.