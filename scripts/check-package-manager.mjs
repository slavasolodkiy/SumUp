#!/usr/bin/env node
/**
 * Cross-platform preinstall guard.
 *
 * Works on Linux, macOS, AND Windows (PowerShell / cmd) — no POSIX shell
 * required. Uses Node.js built-ins only.
 *
 * What it does:
 *   1. Errors out if the install is not being run via pnpm.
 *   2. Removes stray package-lock.json / yarn.lock files that would confuse
 *      editors and other tooling.
 */

import { existsSync, unlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve workspace root: this file lives at <root>/scripts/check-package-manager.mjs
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, "..");

const agent = process.env.npm_config_user_agent ?? "";

if (!agent.startsWith("pnpm/")) {
  process.stderr.write(
    "\n\u274c  This project uses pnpm.\n" +
    "    Please install it: https://pnpm.io/installation\n" +
    "    Then run: pnpm install\n\n"
  );
  process.exit(1);
}

for (const lockfile of ["package-lock.json", "yarn.lock"]) {
  const p = resolve(root, lockfile);
  if (existsSync(p)) {
    unlinkSync(p);
    process.stdout.write(`Removed stray ${lockfile}\n`);
  }
}
