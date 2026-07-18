# Implementation Phases

This file is the single source of truth for the implementation order.

Each phase must:

- Be small and coherent.
- Leave the language in a working state.
- Contain either core language work or standard library work.
- Preserve the agreed ordering unless explicitly changed.

---

## `ph01` Minimal execution — Core

- Run a source file
- Integer literals
- Variables
- Print integers
- Basic syntax/runtime errors

**Result:** Programs can store, calculate, and print integers.

---

## `ph02` Integer expressions — Core

- Integer arithmetic
- Operator precedence
- Basic type inference

**Result:** Integer expressions work predictably.

---

## `ph03` Conditional expressions — Core

- Expression-oriented evaluation
- `if / else`

**Result:** Programs can make decisions and produce conditional values.

---

## `ph04` Basic functions — Core

- Function definitions
- Function calls
- Parameters
- `lf01` Implicit return

**Result:** Reusable logic becomes possible.

---

## `ph05` Convenient calls — Core

- `lf02` Bare zero-argument calls
- `lf04` Named arguments
- `lf05` Optional arguments

**Result:** Function calls become concise and readable.

---

## `ph06` Environment access — Standard library

- `lib01` Environment variables

**Result:** Programs can read their execution environment.

---

## `ph07` Command-line input — Standard library

- `lib02` Program arguments

**Result:** Useful CLI tools become possible.

---

## `ph08` File handling — Standard library

- `lib03` Read files
- Write files
- Check whether files exist

**Result:** CLI tools can process persistent data.

---

## `ph09` Strings — Core

- String literals
- Basic string operations
- Printing strings

**Result:** Programs can properly work with text.

---

## `ph10` Booleans and comparisons — Core

- Boolean literals
- Comparison operators
- Printing booleans

**Result:** Conditions can be represented as explicit values.

---

## `ph11` Loops — Core

- Basic looping construct

**Result:** Repetitive work is possible without recursion.

---

## `ph12` Collections — Core

- `lf20` Unified collection model
- Collection literals
- Basic collection access

**Result:** Programs can represent multiple values using one collection model.

---

## `ph13` Collection iteration — Core

- `col01` `foreach`

**Result:** Collections can be processed without lambdas.

---

## `ph14` Enums — Core

- `lf35` Enums

**Result:** Programs can model closed sets of named alternatives.

---

## `ph15` Structured returns — Core

- `lf10` Tuple or record return values

**Result:** Functions can return multiple related values.

---

## `ph16` Destructuring — Core

- `lf07` Destructuring structured values

**Result:** Structured values can be consumed conveniently.

---

## `ph17` Dependent defaults — Core

- `lf29` Defaults depending on earlier parameters

**Result:** Functions can expose more expressive APIs.

---

## `ph18` Simple objects — Core

- `obj01` Simple objects
- Fields
- Methods

**Result:** Data and behaviour can be grouped without classes.

---

## `ph19` Traits — Core

- `lf16` Reusable behaviour
- Traits usable by simple objects

**Result:** Behaviour can be composed before classes exist.

---

## `ph20` HTTP — Standard library

- `lib04` HTTP requests
- Methods
- Headers
- Status codes
- Text bodies

**Result:** Programs can communicate with external services.

---

## `ph21` Lambdas — Core

- `lf03` Lambdas

**Result:** Behaviour can be written inline.

---

## `ph22` First-class functions — Core

- `lf12` Store functions
- Pass functions
- Return functions

**Result:** Functions become normal values.

---

## `ph23` Functional collection operations — Core

- `col02` `map`
- `col03` `filter`
- `col04` `find`

**Result:** Common collection processing becomes concise.

---

## `ph24` Advanced collection operations — Core

- `col05` `sort`
- `col06` `group`

**Result:** Richer data-processing workflows become possible.

---

## `ph25` JSON — Standard library

- `lib05` Parse JSON
- Serialize JSON

**Result:** Files and HTTP can exchange structured data.

---

## `ph26` Classes — Core

- `cls01` Classes
- Construction
- Shared object definitions

**Result:** Classes are added after objects and traits have proven insufficient by themselves.

---

## `ph27` Reduction — Core

- `col07` `reduce`

**Result:** Arbitrary collection accumulation becomes possible.

---

## `ph28` Database access — Standard library

- `lib06` Initial database support

**Result:** Programs can store and query structured persistent data.
