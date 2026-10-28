# Contributing

Keep game rules pure and separate from rendering. For future feature work, write behavior checks before implementation, then run focused checks and the full CI suite. Keep secrets and `.env` files out of source control.

Use short Conventional Commits such as `feat(wordle): add daily guess feedback` and `fix(timer): restore elapsed time after restart`. Feature flags must not replace server authorization. Update setup and product notes when behavior changes.
