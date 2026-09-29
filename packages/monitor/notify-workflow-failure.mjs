// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

/**
 * Notifier entry point for the PWA E2E failure alert (#726). The
 * pwa-e2e-notify workflow runs this via `workflow_run` after a non-clean
 * `PWA E2E` run; it sends one Telegram alert.
 *
 * Imports the dependency-free ./telegram.mjs leaf rather than
 * monitor-resources.mjs, deliberately. monitor-resources statically imports the
 * native `canvas` addon (via render-burndown.mjs), so a missing or broken canvas
 * prebuild would throw at module scope and lose the alert before a line of it
 * ran. The alert path must not be able to die before it runs; that is the whole
 * point of the ticket.
 *
 * Reads three env vars from the `github.event.workflow_run` context:
 * WORKFLOW_NAME, RUN_CONCLUSION, RUN_URL. Requires TELEGRAM_BOT_TOKEN and
 * TELEGRAM_CHAT_ID (the existing repo secrets sendTelegram consumes).
 *
 * `main` takes its env and its sender as injected seams so the wiring is
 * testable. That is not ceremony. This repo has been bitten by an untested
 * CLI-wiring layer before: see the "main: the CLI wiring" block in
 * .github/scripts/version-check.test.mjs, whose comment records that eight
 * mutations of it survived the whole suite. The mutations that matter here are a
 * swapped field, a typo'd env key, and a rename on one side of the
 * workflow-to-script env contract. None of them throw, and all of them ship
 * green.
 *
 * @module notify-workflow-failure
 */

import { realpathSync } from "fs";
import { fileURLToPath } from "url";
import { formatWorkflowFailureMessage, sendTelegram } from "./telegram.mjs";

/**
 * The env keys this script reads. Exported so the cross-file test can assert the
 * workflow's `env:` block declares exactly these: a rename on either side of
 * that contract would otherwise degrade the alert silently.
 */
export const ENV_KEYS = ["WORKFLOW_NAME", "RUN_CONCLUSION", "RUN_URL"];

/**
 * Build the alert from the environment and send it.
 *
 * @param {object} [deps]
 * @param {Record<string, string | undefined>} [deps.env] - defaults to process.env
 * @param {(text: string) => Promise<void>} [deps.send] - defaults to sendTelegram
 * @returns {Promise<string>} the message that was sent
 */
export async function main({ env = process.env, send = sendTelegram } = {}) {
  const message = formatWorkflowFailureMessage({
    workflow: env.WORKFLOW_NAME,
    conclusion: env.RUN_CONCLUSION,
    runUrl: env.RUN_URL,
  });
  await send(message);
  return message;
}

const __filename = fileURLToPath(import.meta.url);
const isMain =
  process.argv[1] && realpathSync(process.argv[1]) === realpathSync(__filename);
if (isMain) {
  main()
    .then((message) => {
      console.log(`Sent CI-failure notification:\n${message}`);
    })
    .catch((err) => {
      // Log the error OBJECT, not err.message. A fetch failure in Node throws a
      // TypeError whose message is the bare string "fetch failed", with the real
      // reason (DNS, TLS, ECONNRESET) hidden in err.cause. Printing only the
      // message leaves "fetch failed" as the entire diagnostic for a lost alert.
      console.error(err);
      process.exit(1);
    });
}
