# Firestore Rules Tests

**Dependencies install cleanly and the harness resolves; the emulator run itself has never completed in this repository.** `@firebase/rules-unit-testing` drives these tests against the real Firestore emulator, and the Firestore emulator requires a local Java runtime. This sandbox does not have one — `npx firebase-tools emulators:exec --only firestore "npm test"` fails with `Could not spawn \`java -version\`. Please make sure Java is installed and on your system PATH.` (see `docs/SECURITY-FOLLOWUP.md` and `docs/FIRESTORE-SECURITY-AUDIT.md`). Do not treat these as passing, or as any kind of proof the rules work, until someone actually runs them somewhere with Java available and reports the result.

## What's covered

`rules.test.js` exercises `../../firestore.rules` directly (reads the file from disk, doesn't require deploying anything) across `reviews`, `articles`, `recommendations`, `restaurants`, `restaurant_signups`, `users`, `restaurant_correction_requests`, `restaurant_import_candidates`, `restaurant_translation_requests`, `staff`, `customers`, `events`, `sales_signups`, and `blackcab_early_access` — see the file's own header comment for the full scenario list. It also asserts that a collection outside this rules file's scope (e.g. `orders`) is denied to everyone, including an admin — a sanity check on the "no catch-all" design described in `firestore.rules`'s own SCOPE comment.

## How to actually run these

You need a JDK (Java 11+) installed, then:

```
cd tests/firestore-rules
npm install
npx firebase-tools emulators:exec --only firestore "npm test"
```

Note the package name: `npx firebase ...` (without `-tools`) does **not** work — `firebase` is a different npm package (the client SDK, already a devDependency here with no CLI binary), so npx either fails outright or silently resolves the wrong thing. The actual CLI package is `firebase-tools`.

`firebase-tools emulators:exec` starts the Firestore emulator, runs the given command against it, then shuts it down — no real Firebase project or credentials are touched; everything runs against `demo-london-food-hubs-rules-test`, a fake project id the emulator accepts for local-only testing. `firebase-tools` will print an "not currently authenticated" warning — that's expected and harmless for this use case; no `firebase login` is required to run the emulator locally.

If you'd rather run the emulator persistently while iterating:

```
npx firebase-tools emulators:start --only firestore
# in a second terminal:
cd tests/firestore-rules && npm test
```

## If a test fails

That means `firestore.rules` doesn't do what its own comments claim, or this test file has a bug — both are worth knowing before deploying. Don't silently loosen the rule to make a test pass; figure out which one is wrong.
