# VERA-318 Original Report (cycle 2)

Mode: redo-pr (Vera re-ran after PR rework, before re-publish)
Cycle: 2
Generated: 2026-05-29 23:45

See also: [Final Synthesis (cycle 2)](LINK_TO_BE_ADDED_AT_CLOSE_OUT)
(Earlier cycles: [Synthesis (cycle 1)](https://github.com/wainwmr/spem-player/issues/318#issuecomment-4564550629))

## Raw agent reports (pass 1)

### code-reviewer

> Clean. Rebase resolution in `build/buildScores.mjs` correctly preserves PR #396's parseArgs structural refactor AND PR #318's `--skip-if-missing` SVG-probe. No issues 80+ confidence.

### pr-test-analyzer

> Clean. Merged `postprocessSvg.test.ts` correctly tests both behaviours (anchor stripping + data-part; malformed-href tolerance). No rebase residue.

### silent-failure-hunter

> **[A] CRITICAL — CI `test` job will fail loudly with no LilyPond install** (`.github/workflows/ci.yml:34` ⟷ `build/buildScores.mjs:67-88` ⟷ `package.json:40`). The `test` job runs `npm run check && npm run build`. `npm run build` triggers `prebuild` → `node build/buildScores.mjs --skip-if-missing`. Pre-#318 this was a safe no-op (no LilyPond → "Skipping … using committed SVGs"). Post-rebase, the new probe at `buildScores.mjs:76-81` requires `src/scores/Hugh Keyte/modern/Choir I A.svg` on disk before `--skip-if-missing` will skip. `src/scores/` is now gitignored and CI does not install LilyPond, so the probe trips, `process.exit(1)` runs, and `npm run build` fails. CI gate broken for every PR. Recommended: add `bash build/install-lilypond.sh && export PATH=...` before `npm run build` in the `test` job (mirroring `netlify.toml`).
>
> **[B] CRITICAL — Integration test `skips gracefully with --skip-if-missing` will break** (`src/test/integration/buildScores.test.ts:407-426`). Test sets `PATH=""`, runs `--skip-if-missing` with `cwd: REPO_ROOT`, expects exit 0 + "skipping" output. Post-rebase, with `src/scores/` gitignored on a CI checkout, the probe fails first → exit 1 + "no pre-built SVGs" — no "skipping" anywhere. Both assertions fail. Recommended: split into two cases (fails-without-SVGs vs skips-with-SVGs), or create the probe file in test setup.
>
> **[C] HIGH — Probe hard-coded to "Hugh Keyte" edition; `--version` flag bypasses it** (`buildScores.mjs:76`). A user running `--skip-if-missing --version OUP` on a machine with Hugh-Keyte SVGs but no OUP SVGs gets "Using existing SVGs" → exit 0 → silent wrong-edition build. Recommended: parameterise probe path by `options.version`.
>
> **[D] MEDIUM — Single-canary probe doesn't catch partial-build state** (`buildScores.mjs:76-83`). An interrupted previous build (4 of 16 SVGs generated) leaves the canary present → probe passes → "successful" build ships missing scores. Recommended: either accept with honest comment, or probe full inventory from `src/lilypond/*/*/Choir*.ly` globs.
>
> **[E] MEDIUM — Netlify `lilypond --version` probe does not enforce minimum version** (`netlify.toml:15`). Probe verifies LilyPond runs at all, doesn't check 2.26.0 minimum. The netlify.toml comment claims "fail-loud probe to catch silent install regression" — probe is weaker than comment suggests.
>
> **[F] LOW — `install-lilypond.sh` leaves partial extracted tarball on tar failure** (`install-lilypond.sh:31-34`). Subsequent runs hit `[ -x "$LILYPOND_BIN" ]` and print "Using cached" even when the cache is incomplete. The execution probe at line 47 catches it (fail-loud) but the log is misleading.

### type-design-analyzer

> **#1 Critical — `globalThis` channel typed as `any`** (`src/test/setup.ts`, `src/ts/MusicScore.ts:#loadSvg`). `(globalThis as any).__SPEM_TEST_SVG_LOADER` defeats the loader signature. A fixture refactor returning `undefined` instead of `null` passes the `svg !== null` check (since `undefined !== null` is true) and propagates a non-string into `parseSvg`/innerHTML. Recommended: ambient `.d.ts` declaration with typed signature.
>
> **#2 Important — `svg !== null` is the wrong sentinel check** (`MusicScore.ts:#loadSvg`). The loader contract says "null means fall through" but `undefined` returns slip through as valid SVGs. Use `svg != null` or `typeof svg === "string"`.
>
> **#3 Important — Loader type duplicates in 3 places** (`MusicScore.ts`, `setup.ts`). Extract `type TestSvgLoader = (scoreType, choir, recording) => string | null;`.
>
> **#5 Out of scope — Event names stringly-typed across MusicElement subclasses**. Out of scope for #318.
>
> **#7 Important — Permissive `Record<string, number>` + fallback in `fixtureScore.ts`**. Tests should fail loudly on unknown inputs, not silently fall back to "modern". Tighten to `keyof typeof VIEWBOX_WIDTHS`.

### comment-analyzer

> **[A] Important — `testSvgLoader` JSDoc overstates tree-shaking guarantee** (`MusicScore.ts:12-22`). JSDoc says "production bundles never carry the hook" but the static field declaration sits outside any gate. The runtime checks are tree-shaken; the slot is not. Tighten to "production bundles never invoke the hook".
>
> **[B] Important — Probe comment implies broader coverage than provided** (`buildScores.mjs:73-75`). Comment says "requires existing SVGs to skip safely" but probe is a single canary; a future maintainer may assume the probe checks all SVGs.
>
> **[C] Low — `waitingForLoaded` variable name stale post-event-rename** (`score.test.ts:340`). Variable still called `waitingForLoaded` though it now awaits `music-score-ready`.

- Claude
