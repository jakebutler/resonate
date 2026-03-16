#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  cwd: process.cwd(),
  encoding: "utf8",
}).trim();
const docsDir = path.join(repoRoot, "docs");
const specPath = path.join(docsDir, "spec.md");
const changelogPath = path.join(docsDir, "changelog.md");
const projectStatusPath = path.join(docsDir, "project-status.md");
const promptPath = path.join(repoRoot, ".codex", "prompts", "documentation-subagent.md");

const args = new Set(process.argv.slice(2));
const skipAgent = args.has("--skip-agent");
const skipChangelog = args.has("--skip-changelog");

mkdirSync(docsDir, { recursive: true });

const now = new Date();
const timestamp = formatTimestamp(now);
const branch = safeRun(["git", "rev-parse", "--abbrev-ref", "HEAD"]).trim() || "unknown";
const recentCommits = splitLines(safeRun(["git", "log", "--oneline", "-5"]));
const stagedChanges = splitLines(safeRun(["git", "diff", "--cached", "--name-status"]));
const workingTreeChanges = splitLines(safeRun(["git", "status", "--short"]));
const changedFiles = getChangedFiles(stagedChanges, workingTreeChanges);

if (!existsSync(specPath)) {
  writeFileSync(
    specPath,
    "# Resonate Spec\n\nLast updated: " + now.toISOString().slice(0, 10) + "\n",
    "utf8"
  );
}

if (!existsSync(changelogPath)) {
  writeFileSync(
    changelogPath,
    "# Changelog\n\nAppend-only session log for repository-level updates.\n",
    "utf8"
  );
}

writeFileSync(projectStatusPath, buildProjectStatus({
  timestamp,
  branch,
  recentCommits,
  workingTreeChanges,
  changedFiles,
}), "utf8");

const shouldRunAgent = !skipAgent && canRunDocumentationAgent(promptPath);
const agentSucceeded = shouldRunAgent
  ? runDocumentationAgent({
      repoRoot,
      promptPath,
      timestamp,
      branch,
      recentCommits,
      stagedChanges,
      workingTreeChanges,
    })
  : false;

if (!skipChangelog && !agentSucceeded) {
  const existing = readFileSync(changelogPath, "utf8").trimEnd();
  const appended = `${existing}\n\n${buildChangelogEntry({
    timestamp,
    branch,
    stagedChanges,
    workingTreeChanges,
    changedFiles,
  })}\n`;
  writeFileSync(changelogPath, appended, "utf8");
}

function buildProjectStatus(input) {
  const localNotes = input.workingTreeChanges.length
    ? input.workingTreeChanges.map((line) => `- ${line}`).join("\n")
    : "- Working tree is clean.";

  const currentFocus = input.changedFiles.length
    ? summarizeChanges(input.changedFiles).map((line) => `- ${line}`).join("\n")
    : "- Documentation refresh only.";

  const recent = input.recentCommits.length
    ? input.recentCommits.map((line) => `- ${line}`).join("\n")
    : "- No recent commits found.";
  const lastTask = input.recentCommits[0]
    ? `- ${input.recentCommits[0]}`
    : "- No committed task available.";
  const pickupNotes = buildPickupNotes(input.changedFiles, input.workingTreeChanges);

  return `# Project Status

Last updated: ${input.timestamp}

## State

Resonate is a working content operations app with active surfaces for calendar planning, content editing, workflow review, and idea capture.

## Current Task

Maintain the living documentation and preserve a handoff-quality snapshot of the repo state.

## Session Focus

${currentFocus}

## Last Completed Task

${lastTask}

## Recent Commits

${recent}

## Local Working Tree

${localNotes}

## Next Agent Pickup

${pickupNotes}

## Branch

- ${input.branch}
`;
}

function buildChangelogEntry(input) {
  const summaryLines = summarizeChanges(input.changedFiles);
  const staged = input.stagedChanges.length
    ? input.stagedChanges.map((line) => `- ${line}`).join("\n")
    : "- No staged changes were present when the docs refresh ran.";
  const working = input.workingTreeChanges.length
    ? input.workingTreeChanges.map((line) => `- ${line}`).join("\n")
    : "- Working tree was clean.";

  return `## ${input.timestamp}

### Summary

${summaryLines.map((line) => `- ${line}`).join("\n")}

### Staged Changes

${staged}

### Working Tree Snapshot

${working}

### Branch

- ${input.branch}`;
}

function summarizeChanges(files) {
  const notes = [];
  const has = (pattern) => files.some((file) => pattern.test(file));

  if (has(/^docs\//)) {
    notes.push("Updated repository documentation and handoff records.");
  }
  if (has(/^\.githooks\//) || has(/^scripts\/update-docs\.mjs$/) || has(/^scripts\/install-git-hooks\.sh$/)) {
    notes.push("Adjusted commit-time automation for documentation refreshes.");
  }
  if (has(/^components\/WorkflowBoard\//) || has(/^convex\/workflow\.ts$/) || has(/^lib\/workflow/)) {
    notes.push("Touched the workflow board or editorial workflow logic.");
  }
  if (has(/^app\/ideas\//) || has(/^components\/IdeasPage\//) || has(/^convex\/ideas\.ts$/)) {
    notes.push("Touched the captured ideas experience.");
  }
  if (has(/^app\/api\/llm\//) || has(/^lib\/cortex\.ts$/) || has(/^lib\/llmClient\.ts$/)) {
    notes.push("Touched AI assistant request or prompt plumbing.");
  }
  if (has(/^app\/layout\.tsx$/) || has(/^convex\/auth\.config\.ts$/) || has(/^components\/ConvexClientProvider\.tsx$/)) {
    notes.push("Touched auth or environment wiring.");
  }
  if (has(/^app\/page\.tsx$/) || has(/^components\/Calendar\//) || has(/^components\/ContentLibrary\//)) {
    notes.push("Touched the main dashboard surfaces.");
  }
  if (notes.length === 0) {
    notes.push("Refreshed documentation for the current repository state.");
  }

  return [...new Set(notes)];
}

function buildPickupNotes(changedFiles, workingTreeChanges) {
  const notes = [
    "Start by checking the living docs against the current code before making assumptions.",
    "If the working set includes product changes, keep `docs/spec.md`, `docs/changelog.md`, and `docs/project-status.md` aligned in the same session.",
  ];

  const hasChangedFile = (pattern) => changedFiles.some((file) => pattern.test(file));
  const hasWorkingTreeLine = (pattern) => workingTreeChanges.some((line) => pattern.test(line));

  if (
    hasChangedFile(/^app\/layout\.tsx$/) ||
    hasChangedFile(/^convex\/auth\.config\.ts$/) ||
    hasWorkingTreeLine(/app\/layout\.tsx/) ||
    hasWorkingTreeLine(/convex\/auth\.config\.ts/)
  ) {
    notes.push("Review the in-flight auth/env wiring changes before touching shared layout or Clerk/Convex setup.");
  }

  if (
    hasChangedFile(/^convex\/workflow\.ts$/) ||
    hasChangedFile(/^components\/WorkflowBoard\//) ||
    hasChangedFile(/^lib\/workflow/)
  ) {
    notes.push("Workflow changes should preserve the distinction between backend stages and the simplified kanban columns.");
  }

  if (
    hasChangedFile(/^convex\/ideas\.ts$/) ||
    hasChangedFile(/^components\/IdeasPage\//) ||
    hasChangedFile(/^app\/ideas\//)
  ) {
    notes.push("Do not conflate the captured ideas inbox with the separate workflow idea system.");
  }

  return [...new Set(notes)].map((line) => `- ${line}`).join("\n");
}

function getChangedFiles(stagedChanges, workingTreeChanges) {
  const files = new Set();

  for (const line of [...stagedChanges, ...workingTreeChanges]) {
    const normalized = line.trim();
    if (!normalized) continue;
    const parts = normalized.split(/\s+/);
    const maybeFile = parts.at(-1);
    if (maybeFile) files.add(maybeFile);
  }

  return [...files];
}

function canRunDocumentationAgent(promptFilePath) {
  if (!existsSync(promptFilePath)) {
    console.warn("Documentation prompt not found; keeping baseline documentation update.");
    return false;
  }

  const codexPath = safeRun(["bash", "-lc", "command -v codex"]).trim();
  if (!codexPath) {
    console.warn("Codex CLI not found; keeping baseline documentation update.");
    return false;
  }

  return true;
}

function runDocumentationAgent(input) {
  const basePrompt = readFileSync(input.promptPath, "utf8").trim();
  const runtimeContext = [
    "",
    "Current context:",
    `- Timestamp: ${input.timestamp}`,
    `- Branch: ${input.branch}`,
    "",
    "Recent commits:",
    ...input.recentCommits.map((line) => `- ${line}`),
    "",
    "Staged changes:",
    ...(input.stagedChanges.length
      ? input.stagedChanges.map((line) => `- ${line}`)
      : ["- None detected."]),
    "",
    "Working tree snapshot:",
    ...(input.workingTreeChanges.length
      ? input.workingTreeChanges.map((line) => `- ${line}`)
      : ["- Clean working tree."]),
  ].join("\n");

  const prompt = `${basePrompt}\n${runtimeContext}\n`;

  try {
    run([
      "codex",
      "exec",
      "--dangerously-bypass-approvals-and-sandbox",
      "--cd",
      input.repoRoot,
      "--skip-git-repo-check",
      "--ephemeral",
      prompt,
    ], { stdio: "inherit" });
    return true;
  } catch (error) {
    console.warn(`Codex documentation subagent failed: ${formatError(error)}`);
    return false;
  }
}

function formatTimestamp(date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
    hour12: false,
    hourCycle: "h23",
  }).format(date).replace(",", "");
}

function splitLines(value) {
  return value
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean);
}

function run(command, options = {}) {
  return execFileSync(command[0], command.slice(1), {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
}

function safeRun(command, options = {}) {
  try {
    return run(command, options);
  } catch {
    return "";
  }
}

function formatError(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error ?? "unknown error");
}
