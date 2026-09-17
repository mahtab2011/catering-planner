# Dependency Security Remediation — Task N

Written for: whoever decides when London Food Hubs is safe to launch, and
whoever next runs `npm audit` and wonders why a number changed. This
documents the actual `npm audit` findings as of 2026-09-17, what was
investigated about each one's real reachability, what was changed, and
why. **Running `npm audit` lower is not the same as "secure"** — this
document distinguishes fixed-and-verified from accepted-and-documented
risk, and does not claim either SmartServeUK or London Food Hubs is fully
secure as a result of this task.

**Read this alongside** `docs/PRODUCTION-READINESS-AUDIT.md` (J-05–J-07,
the original dependency findings this task re-verifies and updates).

## Baseline (before this task)

- Node `v24.16.0`, npm `11.13.0`.
- `next@16.1.6`, `react@19.2.3`, `firebase@^12.8.0` (resolved `12.8.0`).
- `npm audit --omit=dev`: **10 vulnerabilities (2 moderate, 5 high, 3
  critical)**.
- `npm audit` (all dependencies): **19 vulnerabilities (1 low, 4
  moderate, 11 high, 3 critical)**.

This differs in specific package names from Task J's original audit
(which named `xlsx`, `websocket-driver`, `protobufjs`, `sharp`) because
the dependency tree and the public advisory database have both moved on
since then — the same underlying packages are still implicated, plus a
few more (`@grpc/grpc-js`, `@protobufjs/utf8`, `baseline-browser-mapping`,
`nanoid`, `next` itself, `postcss`), but the **total counts (10
production / 19 all) match Task J's original production count exactly**,
confirming this is the same underlying exposure, re-measured against the
current tree rather than a new problem.

## Full vulnerability matrix (baseline)

| Package | Installed | Severity | Direct/Transitive | Parent chain | Fix available |
|---|---|---|---|---|---|
| `@grpc/grpc-js` | 1.9.15 | high | Transitive | `firebase → @firebase/firestore → @grpc/grpc-js` | Yes, `npm audit fix` (1.9.16) |
| `@protobufjs/utf8` | 1.1.0 | moderate | Transitive | `firebase → @firebase/firestore → @grpc/proto-loader → protobufjs → @protobufjs/utf8` | Yes, `npm audit fix` (1.1.2) |
| `baseline-browser-mapping` | 2.9.19 | moderate | Transitive | `next` (and `autoprefixer → browserslist`) | Yes, `npm audit fix` (2.11.24) |
| `nanoid` | 3.3.11 | high | Transitive | `postcss` (both `next`'s internal copy and our own devDependency) | Yes, `npm audit fix` (3.3.19) |
| `next` | 16.1.6 | critical | **Direct** | — | Yes, requires bumping the pinned version to 16.3.5 |
| `postcss` (next's nested copy) | 8.4.31 | high | Transitive | `next` | Only as part of the `next` bump above |
| `protobufjs` | 7.5.4 | critical | Transitive | `firebase → @firebase/firestore → @grpc/proto-loader → protobufjs` | Yes, `npm audit fix` (7.6.6) |
| `sharp` | 0.34.5 | high | Transitive | `next` (optional dep, powers `next/image`'s Image Optimization API) | Only as part of the `next` bump above |
| `websocket-driver` | 0.7.4 | critical | Transitive | `firebase → @firebase/database → faye-websocket → websocket-driver` | Yes, `npm audit fix` (0.7.5) |
| `xlsx` | 0.18.5 | high | **Direct** | — | **No upstream fix exists** |

## Reachability audit (Phase 3)

| Package | Classification | Evidence |
|---|---|---|
| `@grpc/grpc-js` / `protobufjs` / `@protobufjs/utf8` | SERVER-SIDE (Firestore's own Node transport) | Part of `@firebase/firestore`'s Node-targeted gRPC transport, used whenever Firestore is read from a Node.js context (this app's Next.js server components/SSR use the same `lib/firebase.ts` `db` instance as the browser). Not user-input-driven — these advisories require a malformed *response* from the gRPC peer (Google's own Firestore backend), not attacker-supplied request data. |
| `baseline-browser-mapping` | BUILD-TIME ONLY | Browserslist target-resolution data, consumed by `next`'s and `autoprefixer`'s build tooling. Never shipped to the browser or the running server. |
| `nanoid` | BUILD-TIME ONLY | Used internally by `postcss` for its own generated identifiers during CSS processing at build time. Inputs are postcss's own internal state, not attacker-controlled. |
| `next` | SERVER-SIDE, directly reachable | This is the actual framework running the production server — every advisory in its vulnerable range is a real, direct exposure surface for whichever specific issue affects the installed version. |
| `sharp` | **UNREACHABLE (confirmed)** | Re-confirmed Task J's finding: repository-wide search for `next/image`, `next/image`'s `Image` component, and any direct `sharp` import returns zero real usage (`next-env.d.ts`'s `/// <reference types="next/image-types/global" />` is an ambient type declaration only, not a runtime import). `sharp` is only pulled in as `next`'s optional dependency for the Image Optimization API, which this codebase never invokes. |
| `websocket-driver` | Effectively unreachable in practice | Chain runs through `@firebase/database` (Firebase **Realtime Database**), a Firebase subpackage this app never imports — `lib/firebase.ts` only initializes Auth and Firestore (`getFirestore`), never `getDatabase`/`firebase/database`. The vulnerable code ships as part of the `firebase` npm meta-package but its entry point is never executed by any code in this repository. |
| `postcss` | BUILD-TIME ONLY | CSS processing tool; not shipped to the browser or the running server. |
| `xlsx` | Direct dependency, **parsing path unreachable** | See "xlsx" section below. |

## Changes made

### 1. `npm audit fix` (no `--force`) — inspected via dry-run first

A `npm audit fix --dry-run` was run first and its full proposed change
list reviewed before applying anything (per this task's own instruction).
It proposed only patch/minor version bumps within existing semver
ranges — no majors, no removals of real dependencies (only two internal
housekeeping add/remove pairs for `@swc/helpers`/`@humanfs/types`, both
transitive sub-dependencies of ESLint tooling). Applied for real:

- `@grpc/grpc-js` 1.9.15 → 1.9.16
- `@protobufjs/utf8` 1.1.0 → 1.1.2 (plus sibling `@protobufjs/*` packages)
- `protobufjs` 7.5.4 → 7.6.6
- `websocket-driver` 0.7.4 → 0.7.5
- `nanoid` 3.3.11 → 3.3.19
- `baseline-browser-mapping` 2.9.19 → 2.11.24
- A cluster of devDependency-only ESLint-toolchain transitive bumps
  (`@babel/*`, `ajv`, `browserslist`, `picomatch`, `brace-expansion`,
  `flatted`, `js-yaml`, `minimatch`, `update-browserslist-db`,
  `node-releases`, `caniuse-lite`, `electron-to-chromium`) — none of
  these are our own dependencies; they came along as part of the same
  compatible resolution.

**This eliminated 6 of the 10 production advisories** (all of the
Firebase-transport and build-tooling ones) without touching Firebase
itself, `package.json`, or any application code. `package.json` was not
modified by this step — only `package-lock.json`.

### 2. Explicit `next` version bump: `16.1.6` → `16.3.5`

The remaining 3 production advisories (`next` itself, plus `postcss` and
`sharp` as `next`'s own nested transitive dependencies) all required
`npm audit fix --force`, which is explicitly forbidden by this task. The
reason `--force` was requested at all is that `package.json` pins `next`
to an **exact** version (`"16.1.6"`, no `^`/`~`) — npm's ordinary resolver
won't cross that pin without being forced to, even for a same-major
patch/minor release.

Rather than use `--force` (which can also pull in unrelated changes
opaquely), `next`'s pinned version was changed explicitly and by hand,
in `package.json`, from `"16.1.6"` to `"16.3.5"` — the exact version
`npm audit fix --force` itself would have installed — followed by a
normal `npm install` (not `--force`) to regenerate the lockfile.

**This is a minor/patch-level change within the same major version (16),
not a major upgrade**, and required its own justification:

- `next` is a **direct** dependency actually running the production
  server, so it is the one advisory cluster in this whole audit with the
  most straightforward real-world reachability.
- The vulnerable-range advisory list includes several genuinely severe,
  specific issues (e.g. "Unauthenticated Remote Code Execution on
  windows-hosted servers", CSRF bypasses, cache poisoning, SSRF via
  rewrites) that a same-major patch release is the intended fix
  mechanism for.
- `16.3.5`'s peer dependency requirement is `react: "^18.2.0 || ^19.0.0"`
  (checked via `npm view next@16.3.5 peerDependencies`) — already
  satisfied by the installed `react@19.2.3`/`react-dom@19.2.3`, so **no
  React version change was needed or made**.
- This single, explicit change also resolved the nested `postcss`
  (8.4.31 → patched) and `sharp` (0.34.5 → patched) advisories, since
  both are `next`'s own bundled transitive dependencies, not anything
  this repository depends on directly.
- `react`, `react-dom`, and `firebase` were **not** touched — no major
  framework upgrade of any kind was performed, consistent with this
  task's explicit prohibition.

### 3. `xlsx` — retained, not modified, risk documented

No code change was made. See below.

## `xlsx`: usage audit and decision

A repository-wide search for `from "xlsx"` / `require("xlsx")` found
**exactly 5 call sites**, all following the identical pattern:

| File | Usage |
|---|---|
| `app/events/page.tsx` | `XLSX.utils.json_to_sheet` → `XLSX.writeFile` (SmartServeUK events export) |
| `app/events/[id]/EventClient.tsx` | Same pattern (purchase-plan export) |
| `app/events/[id]/EventClient.voice-stable.tsx` | Same pattern (an alternate/backup copy of the above) |
| `app/dashboard/page.tsx` | `XLSX.utils.json_to_sheet` → `XLSX.write` (dashboard export) |
| `app/admin/blackcab-leads/page.tsx` | Same pattern (BlackCab leads export — **not modified**, per this task's instruction never to touch BlackCab) |

A repository-wide search for `XLSX.read(` / `XLSX.readFile(` returned
**zero matches** — nothing in this codebase ever parses an uploaded or
externally supplied spreadsheet with `xlsx`. Every single usage is
one-directional: take data the application already holds in memory
(fetched from Firestore, already trusted) and generate a downloadable
`.xlsx` file, entirely client-side, in the visitor's own browser.

Both `xlsx` advisories — Prototype Pollution (GHSA-4r6h-8v6p-xvw6) and
ReDoS (GHSA-5pgg-2g8v-p4x9) — are in `xlsx`'s **parsing** code paths
(reading/interpreting a spreadsheet file's contents). Since this
application never calls the parsing API on anything (let alone untrusted
input), that vulnerable code path is never reached.

**Decision: retain `xlsx`, unmodified, with documented accepted risk**
(option A from this task's own list). No upstream patched version exists.
Removing it would break 5 real, working export features across
SmartServeUK, London Food Hubs' shared dashboard, and BlackCab admin
tooling — this task was explicitly told not to remove functionality
merely because its package has a vulnerability, and not to perform a
broad spreadsheet-subsystem rewrite. If a maintained, drop-in-compatible
replacement is ever identified, that would be its own bounded,
regression-tested task — not attempted here.

## Other findings (Phase 8)

Every one of the 10 baseline production advisories is accounted for
above — none were ignored for being absent from Task J's original list.
No additional production advisory was found beyond these 10.

## Result

| | Before | After |
|---|---|---|
| **Production** (`npm audit --omit=dev`) | 10 (2 moderate, 5 high, 3 critical) | **1 (0 moderate, 1 high, 0 critical)** |
| **All dependencies** (`npm audit`) | 19 (1 low, 4 moderate, 11 high, 3 critical) | **1 (0 low, 0 moderate, 1 high, 0 critical)** |

The single remaining vulnerability in both counts is `xlsx` — accepted
and documented above, not hidden or suppressed.

**This is not a claim that the application is now "secure."** It means:
measured exposure to currently-known, publicly disclosed `npm audit`
advisories dropped from 10 to 1 in production dependencies, through
verified-compatible patch/minor updates and one deliberate, justified,
same-major-version framework bump — not through suppression, `--force`,
or removing functionality.

## Recommended future action

- If a maintained SheetJS-compatible or drop-in replacement library for
  `xlsx` is ever evaluated, scope it as its own task covering all 5 call
  sites (including the BlackCab one, which would need explicit
  authorization to touch) with full export-output regression testing.
- Consider deleting `app/events/[id]/EventClient.voice-stable.tsx` if it
  is genuinely a stale backup copy (out of scope for this task to
  determine or act on) — it duplicates the same `xlsx` usage and, if
  unused, is dead surface area for this same dependency.
- Re-run `npm audit` periodically — new advisories against `next`,
  `firebase`, or their transitive dependencies will keep appearing over
  time regardless of this task's result today.
