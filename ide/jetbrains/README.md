<!-- Phase: Phase 14 IDE support -->

# Vulci support for JetBrains IDEs

This TextMate bundle provides lightweight Vulci editing support in WebStorm and
other JetBrains IDEs.

## Install

1. Open **Settings** (or **Preferences** on macOS).
2. Open **Editor → TextMate Bundles**.
3. Select **Add** and choose the `Vulci.tmbundle` folder beside this file.
4. Apply the settings and open a `.vulci` file.

Keep the bundle linked to this repository folder. After updating the repository,
restart the IDE if it does not reload a changed grammar automatically.

## Current support

- `.vulci` file recognition
- Phase 14 keywords and built-in types
- declarations, literals, operators, and punctuation
- line comments and nested block comments
- all four string forms, escapes, and interpolation delimiters
- bracket, brace, and parenthesis pairing
- comment toggling and basic indentation rules

This bundle intentionally does not duplicate Vulci parsing or warning rules.
Semantic warnings, errors, completion, navigation, and refactoring require a
later integration with a reusable Vulci analysis API.
