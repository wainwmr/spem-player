#!/usr/bin/env node
// Helper for repetitive GitHub / GitHub Projects v2 operations used by
// .kimi/methods/*.md. Keeps method steps short and reduces token-heavy
// JSON parsing in every call.

import { spawnSync } from "node:child_process";

// Spem Player project (hardcoded; update if the project is recreated).
const PROJECT_ID = "PVT_kwHOAO5EQs4BWPwP";

// Status field on the Spem Player board.
const STATUS_FIELD_ID = "PVTSSF_lAHOAO5EQs4BWPwPzhRlmc0";
const STATUS_OPTIONS = {
  todo: "21bba6ec",
  progress: "decd7b7a",
  review: "78cbe887",
  done: "15acbab0",
};

// Other single-select board fields.
const FIELDS = {
  type: {
    id: "PVTSSF_lAHOAO5EQs4BWPwPzhRmSfo",
    options: {
      bug: "abd10006",
      feature: "ac417643",
      "tech-debt": "49557996",
      "tooling-bug": "553de81d",
    },
  },
  area: {
    id: "PVTSSF_lAHOAO5EQs4BWPwPzhRmTE0",
    options: {
      ui: "da2dbe7b",
      score: "14c794bf",
      canvas: "cd60bce8",
      lily: "efb6b053",
      config: "d541f3a0",
      test: "f2fe34f9",
      tooling: "45abe58a",
      controls: "be734de9",
      docs: "c8b1b5f7",
      audio: "9066c642",
      other: "5e6a6679",
    },
  },
  difficulty: {
    id: "PVTSSF_lAHOAO5EQs4BWPwPzhRmTXA",
    options: {
      xs: "26242371",
      s: "483084dd",
      m: "6e1c1b4c",
      l: "6db99d99",
    },
  },
  category: {
    id: "PVTSSF_lAHOAO5EQs4BWPwPzhTMxPs",
    options: {
      "a-in": "dc53efe6",
      "a-sp": "2a7a9152",
      "a-me": "743a3e63",
      "a-out": "fb7a482f",
      "a-yawn": "aa456021",
    },
  },
};

function run(args, { capture = true, stdin = null } = {}) {
  const result = spawnSync(args[0], args.slice(1), {
    stdio: capture ? [stdin || "ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf-8",
    shell: false,
  });
  if (result.status !== 0) {
    const err = (result.stderr || "").trim() || (result.stdout || "").trim();
    throw new Error(`${args.join(" ")} failed: ${err}`);
  }
  return capture ? (result.stdout || "").trim() : "";
}

async function getItemId(issue) {
  const out = run([
    "gh", "project", "item-list", "2",
    "--owner", "wainwmr",
    "--query", `#${issue}`,
    "--format", "json",
  ]);
  const data = JSON.parse(out);
  const item = data.items?.[0];
  if (!item?.id) {
    throw new Error(`No board item found for issue #${issue}`);
  }
  return item.id;
}

async function setStatus(issue, statusName) {
  const optionId = STATUS_OPTIONS[statusName];
  if (!optionId) {
    throw new Error(
      `Unknown status "${statusName}". Use one of: ${Object.keys(STATUS_OPTIONS).join(", ")}`
    );
  }
  const itemId = await getItemId(issue);
  run([
    "gh", "project", "item-edit",
    "--project-id", PROJECT_ID,
    "--id", itemId,
    "--field-id", STATUS_FIELD_ID,
    "--single-select-option-id", optionId,
  ]);
  return itemId;
}

async function assignIssue(issue) {
  run(["gh", "issue", "edit", String(issue), "--add-assignee", "@me"]);
}

async function closeIssue(issue, comment) {
  const args = ["gh", "issue", "close", String(issue)];
  if (comment) {
    args.push("--comment", comment);
  }
  run(args);
}

async function prChecks(pr) {
  const out = run([
    "gh", "pr", "view", String(pr),
    "--json", "mergeStateStatus,statusCheckRollup",
  ]);
  return JSON.parse(out);
}

async function listIssues({ author, label }) {
  const args = [
    "gh", "issue", "list",
    "--repo", "wainwmr/spem-player",
    "--author", author,
    "--state", "all",
    "--limit", "10",
  ];
  if (label) {
    args.push("--label", label);
  }
  console.log(run(args));
}

async function listPrs({ author }) {
  console.log(run([
    "gh", "pr", "list",
    "--repo", "wainwmr/spem-player",
    "--author", author,
    "--state", "all",
    "--limit", "10",
  ]));
}

async function myOpenPrs() {
  const out = run([
    "gh", "pr", "list",
    "--repo", "wainwmr/spem-player",
    "--state", "open",
    "--author", "@me",
    "--json", "number,title,reviewDecision",
  ]);
  console.log(out);
}

async function setField(issue, fieldName, optionName) {
  const field = FIELDS[fieldName];
  if (!field) {
    throw new Error(
      `Unknown field "${fieldName}". Use one of: ${Object.keys(FIELDS).join(", ")}`
    );
  }
  const optionId = field.options[optionName];
  if (!optionId) {
    throw new Error(
      `Unknown ${fieldName} option "${optionName}". Use one of: ${Object.keys(field.options).join(", ")}`
    );
  }
  const itemId = await getItemId(issue);
  run([
    "gh", "project", "item-edit",
    "--project-id", PROJECT_ID,
    "--id", itemId,
    "--field-id", field.id,
    "--single-select-option-id", optionId,
  ]);
  console.log(`#${issue} ${fieldName} → ${optionName}`);
}

async function help() {
  console.log(`Usage: node .kimi/scripts/gh-helper.mjs <command> [args]

Commands:
  item-id <issue>                 Print the project item ID for an issue.
  status <issue> <name>           Move issue to status: todo, progress, review, done.
  assign <issue>                  Assign issue to @me.
  close <issue> [comment]         Close issue with optional comment.
  pr-checks <pr>                  Print PR merge state and checks as JSON.
  set-field <issue> <field> <opt> Set a board field (type/area/difficulty/category).
  issues <author> [label]         List issues by author, optionally filtered by label.
  prs <author>                    List PRs by author.
  my-prs                          List your open PRs with review decisions.

Examples:
  node .kimi/scripts/gh-helper.mjs item-id 558
  node .kimi/scripts/gh-helper.mjs status 558 review
  node .kimi/scripts/gh-helper.mjs close 564 "Superseded by #581."
  node .kimi/scripts/gh-helper.mjs set-field 581 type tooling-bug
  node .kimi/scripts/gh-helper.mjs issues wainwright1000 question
`);
}

const commands = {
  "item-id": async (issue) => console.log(await getItemId(issue)),
  status: async (issue, statusName) => {
    await setStatus(issue, statusName);
    console.log(`#${issue} → ${statusName}`);
  },
  assign: async (issue) => {
    await assignIssue(issue);
    console.log(`#${issue} assigned to @me`);
  },
  close: async (issue, ...commentParts) => {
    await closeIssue(issue, commentParts.join(" ") || undefined);
    console.log(`#${issue} closed`);
  },
  "pr-checks": async (pr) => console.log(JSON.stringify(await prChecks(pr), null, 2)),
  "set-field": async (issue, fieldName, optionName) => setField(issue, fieldName, optionName),
  issues: async (author, label) => listIssues({ author, label }),
  prs: async (author) => listPrs({ author }),
  "my-prs": async () => myOpenPrs(),
  help,
};

const [cmd, ...args] = process.argv.slice(2);
const handler = commands[cmd] || help;
handler(...args).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
