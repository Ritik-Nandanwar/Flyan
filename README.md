# Flyan

Flyan is a four-game daily puzzle app built with Expo and React Native. This workspace contains a playable local-first prototype styled from the supplied reference screens.

## Project structure and feature flags

The application is organized by responsibility: `src/screens/` contains page-level screens, `src/components/games/` contains reusable game boards, `src/components/ui/` contains shared controls, `src/games/` contains game rules and attempt factories, `src/config/` contains feature switches and game assets, `src/theme/` contains colors and styles, and `tests/` contains engine tests. `App.tsx` coordinates navigation and persisted state.

To disable a game or capability, set its boolean to `false` in [`src/config/featureFlags.ts`](src/config/featureFlags.ts). Game flags hide the game from the landing page and archive and block attempts from being started. Other flags control authentication, guest play, profile, archive calendar, daily streak/countdown, game timer/help/replay, feedback animations, Sudoku undo/redo and cell clearing, and Worldle silhouette/suggestions/distance hints. These are local build-time flags and are intended for simple app configuration.

## Current implementation

- Daily home with Wordle, random 6×6 Sudoku, Verticle and Worldle cards, status, countdown and profile entry.
- Wordle with duplicate-aware letter scoring, animated tile feedback, keyboard colors, and unlimited guesses until solved.
- Sudoku generates a shuffled 6×6 solution with 2×3 regions, fixed clues, and row/column/region/solution validation after each number-pad tap.
- Verticle uses the same date answer as Wordle; enter five-letter guesses vertically in columns with animated feedback and colored keyboard keys.
- Worldle with 237 bundled Natural Earth country silhouettes, suggestions after two letters, and eight-direction distance hints.
- Archive calendar with playable October dates up to today, date-specific puzzles, and separate local daily/archive progress. Wordle, Verticle and Worldle continue until solved.
- Timers derived from persisted start timestamps; local attempt state survives app restarts.
- Guest flow and account form surfaces. Authentication currently needs Firebase project configuration and a trusted backend.

## Run

Use Node.js 22.13+ (Node.js 24.3+ is also supported by Expo SDK 58), then run:

```sh
npm install
npm run start
npm test
npm run typecheck
npm run lint
npm run format:check
```

The start command launches Expo Go mode. Update Expo Go on the iPhone to the SDK 58 compatible App Store release before scanning the QR code; Expo has announced that this store release is rolling out after the SDK 58 release. If that update is not available yet, use an SDK 58 development build instead. SDK 58 requires iOS 16.4 or newer. For native development builds, configure the local SDKs and use `npm run android` or `npm run ios`. Google sign-in requires native OAuth configuration and a development build; Expo Go is not sufficient.

## Firebase setup

Copy `.env.example` to `.env` and fill the public Firebase app configuration. Then create Firebase Auth, Firestore and Functions resources as described in [FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md). Do not put service-account credentials in the app. The current prototype does not connect to Firebase: account forms explain the missing setup and guest progress is stored on-device.

## Architecture

- `App.tsx`: navigation, app state, and local persistence.
- `src/screens/`: auth, home, archive, profile, and game screens.
- `src/components/games/`: reusable Wordle-style, Sudoku, and Worldle interfaces.
- `src/components/ui/`: shared Flyan buttons, cards, and labels.
- `src/config/featureFlags.ts`: centralized per-game and app-capability switches.
- `src/theme/`: shared color tokens and component styles.
- `src/hooks/`: shared animation behavior.
- `src/games/engines.ts`: pure game helpers and the starter puzzle data.
- `assets/reference/`: the seven supplied mockups for design reference.

## Known limitations before public release

This is a locally playable prototype, not a production multiplayer-safe release. Firebase authentication, username lookup, server-side answer validation, uniqueness enforcement, security rules, App Check, remote flags, analytics consent, privacy/account deletion, accessible screen-reader audits, and automated quality gates still need implementation. Puzzle answers and the sample country data are bundled for local play. Replace them with server-authorized puzzle delivery before shipping. The country list and silhouette are illustrative; no country silhouette dataset is included. Daily rollover is UTC. Archive puzzles use the same starter content for each chosen past date. The app does not silently merge guest data into an account.

## Product decisions recorded

- UTC daily rollover and archive-only past dates follow the supplied specification.
- Verticle uses the provisional column/target interpretation from section 4.3.
- Six-by-six Sudoku uses two-row by three-column regions.
- Guest history stays local.

Sudoku puzzles are generated with a randomized 6×6 solution and clue layout, then cached with each local attempt. Country geometry is public-domain Natural Earth data, simplified and bundled locally.

See [PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md), [TEST_PLAN.md](docs/TEST_PLAN.md), [RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md) and [FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md) for implementation and release notes.

The game contains 12,653 unique five-letter entries sourced from the MIT-licensed `an-array-of-english-words` v2.0.0 package. Wordle accepts any entry in this file. Daily answers use a date-seeded selection from the same set, so Wordle and Verticle share the same five-letter answer for a given date and archive date.
