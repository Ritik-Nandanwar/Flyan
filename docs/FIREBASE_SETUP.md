# Firebase setup

Firebase is not connected in the current local prototype. Configure separate development/staging and production projects before enabling account flows.

1. Register Android (`app.flyan.daily`) and iOS (`app.flyan.daily`) apps.
2. Enable Email/Password and Google providers in Firebase Authentication. Configure OAuth clients and Android SHA-1/SHA-256 fingerprints. Google sign-in requires a native development build.
3. Create Firestore and deploy rules that deny clients writes to authoritative attempt outcomes, elapsed time, stats, usernames and answer secrets.
4. Implement callable Functions for normalized username resolution, puzzle delivery, attempt start/finish, answer validation and stats. Use deterministic uniqueness keys for `(uid, puzzleId, mode)` and idempotency keys for completion.
5. Enable App Check and monitor enforcement before turning it on for production.
6. Copy `.env.example` to `.env` and fill only the public client configuration. Never bundle a service account, private OAuth secret or other privileged key.
7. Use Firebase Emulator Suite for Auth, Firestore and Functions development. Add billing alerts, backups, quotas, account deletion, privacy notices and incident response before launch.

Username/password login must resolve username to email only through a trusted, rate-limited function. Do not create a client-readable username-to-email directory. Guest progress stays local until an explicit merge policy exists.
