# Flyan product specification

Flyan offers one daily Wordle, six-by-six Sudoku generated locally with 2×3 regions, Verticle and Worldle puzzle. Daily dates use UTC. Archive attempts are separate from daily attempts and can be replayed after completion. Guest history remains local unless an explicit merge policy is added.

## Prototype implementation notes

The initial app targets Android and iOS through Expo development builds. It implements local gameplay and AsyncStorage persistence. Pure helpers live in `src/games/engines.ts`; the app UI and local navigation are currently in `App.tsx`.

Verticle shares Wordle's five-letter date answer. Guesses are entered vertically in columns and receive duplicate-aware Wordle feedback. Worldle uses a bundled 237-country Natural Earth silhouette set, prefix suggestions, haversine distance and eight-way directional hints. The bundled Natural Earth outlines are public domain. The five-letter list has its own MIT license notice. These local puzzle answers are for development only; production puzzle answers must be validated by a trusted service and must not be sent in initial public payloads.

## Release requirements still outstanding

Backend authorization and uniqueness, Firebase Auth providers, username index, Google native setup, Firestore rules, Functions, App Check, remote feature flags, emulator-backed integration tests, accessibility audit, localization extraction, privacy and deletion flows, and production puzzle assets are required before public release.
