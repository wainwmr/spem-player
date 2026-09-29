// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

/**
 * Tests for the PWA E2E failure notifier (#726).
 *
 * Two layers, and the second is the point.
 *
 * The WIRING tests exercise `main` through its injected seams. Before this, the
 * only test was on the pure formatter, and the formatter is a template string:
 * the part that could realistically be wrong was the four lines of env plumbing,
 * which no test touched. Swap two fields at the call site and the alert reads
 * "CI failure: failure (PWA E2E)"; typo an env key and it ships a blank; drop the
 * await and the process can exit before the POST flushes. None throw. All ship
 * green. This repo has already been bitten by exactly that (see the "main: the
 * CLI wiring" block in .github/scripts/version-check.test.mjs, whose comment
 * records that eight mutations of that layer survived the whole suite).
 *
 * The CONTRACT tests read the workflow YAML and assert the couplings that span
 * files, because those are the ones nothing else can see. GitHub does not
 * validate them: a `workflows:` name that matches nothing simply never fires, with
 * no error, no annotation, and no log line. The alert would just stop, and the
 * only symptom is silence, which is exactly what a healthy pipeline looks like.
 * There is no YAML parser in this repo, so these read the file as text; that is
 * proportionate for asserting a handful of literals.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { main, ENV_KEYS } from "./notify-workflow-failure.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const WORKFLOWS = resolve(HERE, "../../.github/workflows");
const notifyYml = readFileSync(resolve(WORKFLOWS, "pwa-e2e-notify.yml"), "utf8");
const upstreamYml = readFileSync(resolve(WORKFLOWS, "pwa-e2e.yml"), "utf8");

describe("notify-workflow-failure: the wiring", () => {
  test("sends the formatted message built from the three env vars", async () => {
    const sent = [];
    const message = await main({
      env: {
        WORKFLOW_NAME: "PWA E2E",
        RUN_CONCLUSION: "failure",
        RUN_URL: "https://github.com/wainwmr/spem-player/actions/runs/1",
      },
      send: async (text) => void sent.push(text),
    });

    // Exact equality, so a swapped field at the call site reddens. This is the
    // mutation the formatter's own test cannot see, because the fields arrive
    // already transposed.
    assert.equal(
      message,
      "CI failure: PWA E2E (failure)\nhttps://github.com/wainwmr/spem-player/actions/runs/1"
    );
    assert.deepEqual(sent, [message]);
  });

  test("carries a non-failure conclusion through (the gate is a deny-list)", async () => {
    const sent = [];
    await main({
      env: {
        WORKFLOW_NAME: "PWA E2E",
        RUN_CONCLUSION: "timed_out",
        RUN_URL: "https://example.invalid/run/2",
      },
      send: async (text) => void sent.push(text),
    });
    // The workflow gate admits timed_out, so this is a reachable state, not a
    // decorative one. Before the gate was widened, the formatter was tested
    // against a conclusion the workflow could never deliver to it.
    assert.match(sent[0], /\(timed_out\)/);
  });

  test("names the missing keys in the alert when the env is misconfigured", async () => {
    const sent = [];
    // Actions sets a declared env key whose expression resolves to null to the
    // EMPTY STRING, not undefined, so that is the realistic degraded shape.
    await main({
      env: { WORKFLOW_NAME: "PWA E2E", RUN_CONCLUSION: "failure", RUN_URL: "" },
      send: async (text) => void sent.push(text),
    });
    // Still delivered: suppressing the alert is never the right answer here.
    assert.match(sent[0], /^CI failure: PWA E2E \(failure\)/);
    // But it says so, rather than shipping a blank nobody can act on.
    assert.match(sent[0], /notifier misconfigured: runUrl unset/);
  });

  test("propagates a send failure rather than swallowing it", async () => {
    await assert.rejects(
      () =>
        main({
          env: { WORKFLOW_NAME: "w", RUN_CONCLUSION: "failure", RUN_URL: "u" },
          send: async () => {
            throw new Error("Telegram HTTP 404: bot token missing");
          },
        }),
      /Telegram HTTP 404/
    );
  });
});

describe("notify-workflow-failure: the cross-file contracts", () => {
  test("the workflow declares exactly the env keys the script reads", () => {
    // The highest-value assertion here. A rename on either side degrades the
    // alert in silence: the script reads undefined, the message ships blank, and
    // the job still exits 0.
    const declared = [...notifyYml.matchAll(/^\s{10}([A-Z_]+):\s*\$\{\{/gm)].map(
      (m) => m[1]
    );
    for (const key of ENV_KEYS) {
      assert.ok(
        declared.includes(key),
        `pwa-e2e-notify.yml does not declare env key ${key}, which notify-workflow-failure.mjs reads`
      );
    }
    const extras = declared.filter(
      (k) => !ENV_KEYS.includes(k) && !k.startsWith("TELEGRAM_")
    );
    assert.deepEqual(
      extras,
      [],
      `pwa-e2e-notify.yml declares env keys the script does not read: ${extras.join(", ")}`
    );
  });

  test("the notifier watches the upstream workflow's actual name", () => {
    // `workflows:` matches the upstream's `name:` field, NOT its filename, and
    // GitHub never validates it. Rename the upstream and this silently stops
    // firing forever.
    const upstreamName = upstreamYml.match(/^name:\s*(.+)$/m)?.[1].trim();
    assert.ok(upstreamName, "pwa-e2e.yml declares no name:");
    assert.match(
      notifyYml,
      new RegExp(`workflows:\\s*\\["${upstreamName}"\\]`),
      `pwa-e2e-notify.yml must watch "${upstreamName}" (pwa-e2e.yml's name:), or it will never fire`
    );
  });

  test("the conclusion gate is a deny-list that admits failure and timed_out", () => {
    // The gate IS the feature. Nothing else pins it: flip it to `== 'success'`
    // and it alerts on every green night and never on a red one; write a
    // conclusion GitHub does not emit and it never alerts again. Both ship green.
    const gate = notifyYml.match(/if: >-\s*\n([\s\S]*?)\n\s*runs-on:/)?.[1] ?? "";
    assert.match(gate, /conclusion != 'success'/);
    assert.ok(
      !/conclusion == 'failure'/.test(gate),
      "the gate must not be an equality on 'failure': that misses timed_out and startup failures, which are the regressions most likely to go unseen"
    );
    for (const excluded of ["cancelled", "skipped"]) {
      assert.match(gate, new RegExp(`conclusion != '${excluded}'`));
    }
  });

  test("the alert path pulls in no dependencies", () => {
    // The alert must not be able to die before it runs. telegram.mjs is a leaf
    // with no imports, so the notifier needs no install step and cannot be killed
    // by a native-module build failure (monitor-resources.mjs statically imports
    // the `canvas` addon, which is why the notifier does not import it).
    const telegram = readFileSync(resolve(HERE, "telegram.mjs"), "utf8");
    assert.ok(
      !/^import\s/m.test(telegram),
      "telegram.mjs must stay dependency-free: it is the CI alert's import graph"
    );
    const notifier = readFileSync(
      resolve(HERE, "notify-workflow-failure.mjs"),
      "utf8"
    );
    assert.ok(
      !/from "\.\/monitor-resources\.mjs"/.test(notifier),
      "the notifier must not import monitor-resources.mjs: it drags in the native canvas addon and can throw before the alert is sent"
    );
    assert.ok(
      !/pnpm install/.test(notifyYml),
      "pwa-e2e-notify.yml needs no install step; adding one reintroduces a way for the alert to die before it is sent"
    );
  });
});
