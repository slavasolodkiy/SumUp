#!/usr/bin/env node
/**
 * Cross-platform preinstall guard.
 *
 * Replaces the sh-based preinstall script so this works on Linux, macOS, AND
 * Windows (PowerShell / cmd) without requiring a POSIX shell.
 *
 * What it does:
 *   1. Errors out if the install is not being run via pnpm.
 *   2. Removes stray package-lock.json / yarn.lock files that would confuse
 *      editors and other tooling.
 */

import { existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

const root = new URL("../", import.meta.url).pathname;

const agent = process.env.npm_config_user_agent ?? "";

if (!agent.startsWith("pnpm/")) {
  process.stderr.write(
    "\n❌  This project uses pnpm.\n" +
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
