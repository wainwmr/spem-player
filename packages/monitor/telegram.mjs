// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

/**
 * Telegram text-send, with a dependency-free import graph (#726).
 *
 * This lives apart from monitor-resources.mjs for one reason: the CI failure
 * alert must not be able to die before it runs. monitor-resources.mjs statically
 * imports render-burndown.mjs, which imports the native `canvas` addon. Anything
 * importing monitor-resources therefore loads canvas at module scope, so a
 * missing or broken canvas prebuild throws before a single line of the alert
 * executes, and the alert is silently lost. That is the exact blind spot #726
 * exists to close, reintroduced inside the fix for it.
 *
 * Keeping the send path a leaf module with no imports at all removes that class
 * of failure entirely. monitor-resources.mjs re-exports both functions, so every
 * existing caller and the whole test suite are unchanged, and packages/monitor
 * remains the single home of the Telegram-send logic.
 *
 * @module telegram
 */

const TELEGRAM_API = "https://api.telegram.org/bot";

/**
 * Build the Telegram body for a failed CI workflow run.
 *
 * Pure and side-effect-free, so the message shape is unit-testable without a
 * network mock. `notify-workflow-failure.mjs` feeds it the
 * `github.event.workflow_run` fields and passes the result to sendTelegram.
 *
 * It does not validate, and it does not throw. It names the fault in the message
 * instead. The reason is not "a degraded alert beats no alert" in the abstract:
 * it is that the realistic way a field goes missing is a typo or a rename in the
 * workflow's `env:` block, and that misconfiguration would otherwise ship green
 * and stay green until the night it matters, sending a blank alert nobody can
 * act on. Naming the missing keys inside the delivered message turns a silent
 * misconfiguration into a visible one, at the only moment anyone is looking.
 *
 * Note the fields arrive from GitHub Actions, which sets a declared `env:` key to
 * the EMPTY STRING when its expression resolves to null, rather than leaving it
 * unset. So the realistic degraded value is "", not `undefined`, and the check
 * below is falsiness rather than an `undefined` comparison.
 *
 * @param {object} run
 * @param {string} run.workflow - Upstream workflow name (e.g. "PWA E2E").
 * @param {string} run.conclusion - The run's conclusion (e.g. "failure", "timed_out").
 * @param {string} run.runUrl - URL of the failing run.
 * @returns {string}
 */
export function formatWorkflowFailureMessage({ workflow, conclusion, runUrl }) {
  const missing = Object.entries({ workflow, conclusion, runUrl })
    .filter(([, value]) => !value)
    .map(([key]) => key);
  const body = `CI failure: ${workflow} (${conclusion})\n${runUrl}`;
  return missing.length
    ? `${body}\n\n[notifier misconfigured: ${missing.join(", ")} unset]`
    : body;
}

/**
 * Send a plain-text Telegram message. Throws on a non-2xx, including the
 * response body: the most likely cause of a lost alert is a missing or rotated
 * TELEGRAM_BOT_TOKEN, which makes the URL `.../botundefined/sendMessage` and
 * returns a bare 404. Without the body, that reads as "Telegram moved an
 * endpoint" rather than "your secret is gone".
 *
 * @param {string} text
 */
export async function sendTelegram(text) {
  const url = `${TELEGRAM_API}${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
}
