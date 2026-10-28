# Test plan

Production quality gates from the product specification:

- Pure engine coverage for duplicate-aware Wordle feedback, random 6×6 solution generation, row/column/box placement, and fixed clues, Verticle input/feedback, Worldle distance/direction, and terminal states.
- Timer persistence and malformed timestamp behavior.
- Auth username normalization and provider outcomes.
- Emulator tests for attempt uniqueness, idempotent completion, archive/daily separation, and read-only terminal attempts.
- Calendar UTC rollover and past/current/future selection.
- Device flows for guest persistence, account restoration, archive resume-until-solved, background timer resume, offline drafts, reduced motion and small screens.

These checks have not yet been implemented or run in this prototype. Do not treat a local UI flow as proof of backend authorization or production readiness.

The automated engine tests run with `npm test`. They cover word scoring, keyboard feedback, randomized Sudoku validity, country distance and direction, attempt creation, date helpers, and feature-flag shape.
