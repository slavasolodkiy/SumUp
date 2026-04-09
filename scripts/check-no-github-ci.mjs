#!/usr/bin/env node
/**
 * Policy guard: this repository intentionally has NO GitHub Actions CI.
 *
 * Fails if:
 *   1. .github/workflows/ci.yml exists in the repository, OR
 *   2. Any tracked doc file contains a reference to .github/workflows/ci.yml
 *
 * Run via:  pnpm run verify:policy
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, "..");

let failed = false;

// ── 1. CI workflow file must NOT exist ───────────────────────────────────────

const ciFile = resolve(root, ".github", "workflows", "ci.yml");
if (existsSync(ciFile)) {
  process.stderr.write(
    `\n❌  POLICY VIOLATION: .github/workflows/ci.yml exists.\n` +
    `    This repository intentionally has no GitHub Actions workflow.\n` +
    `    Remove the file and re-run: pnpm run verify:policy\n\n`
  );
  failed = true;
} else {
  process.stdout.write(`✅  .github/workflows/ci.yml — absent (correct)\n`);
}

// ── 2. Doc files must NOT reference ci.yml ───────────────────────────────────

const DOC_FILES = [
  "README.md",
  "replit.md",
  "docs/progress-log.md",
];

const BANNED_PATTERN = /\.github\/workflows\/ci\.yml/;

for (const rel of DOC_FILES) {
  const abs = resolve(root, rel);
  if (!existsSync(abs)) {
    process.stdout.write(`⏭   ${rel} — not found, skipping\n`);
    continue;
  }
  const content = readFileSync(abs, "utf8");
  const lines = content.split("\n");
  const hits = lines
    .map((line, i) => ({ line: i + 1, text: line }))
    .filter(({ text }) => BANNED_PATTERN.test(text));

  if (hits.length > 0) {
    process.stderr.write(`\n❌  POLICY VIOLATION: ${rel} references .github/workflows/ci.yml:\n`);
    for (const { line, text } of hits) {
      process.stderr.write(`    Line ${line}: ${text.trim()}\n`);
    }
    process.stderr.write("\n");
    failed = true;
  } else {
    process.stdout.write(`✅  ${rel} — no ci.yml references\n`);
  }
}

// ── Result ────────────────────────────────────────────────────────────────────

if (failed) {
  process.stderr.write("Policy check FAILED. Fix violations above.\n\n");
  process.exit(1);
}

process.stdout.write("\n✅  Policy check passed — no GitHub Actions CI references found.\n\n");
