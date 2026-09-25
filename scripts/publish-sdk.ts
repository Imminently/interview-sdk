#!/usr/bin/env bun
/**
 * Interactive release flow for the publishable SDK packages
 * (@imminently/interview-sdk, @imminently/interview-ui).
 *
 * Wraps Changesets: lets you pick which package(s) + semver bump, applies
 * the version/changelog bump, builds the changed package(s), then publishes
 * via `changeset publish` (which also git-tags each published version).
 * Both packages are in a Changesets `fixed` group, so they always move to
 * the same version together.
 *
 * Changesets has no native dry-run for publishing, so --dry-run instead
 * runs `npm publish --dry-run` per package directly (a real registry-backed
 * preview of what would ship) and reverts the version bump/changelog
 * afterward so it leaves no trace.
 *
 * Usage:
 *   bun run publish:sdk
 *   bun run publish:sdk:dry-run
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const DRY_RUN = process.argv.includes("--dry-run");

const PACKAGES = [
  { name: "@imminently/interview-sdk", dir: "packages/core" },
  { name: "@imminently/interview-ui", dir: "packages/ui" },
];

function run(cmd: string[], cwd = ROOT) {
  const result = spawnSync(cmd[0], cmd.slice(1), { cwd, stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`\nCommand failed: ${cmd.join(" ")}`);
    process.exit(result.status ?? 1);
  }
}

function readVersion(dir: string): string {
  const pkg = JSON.parse(readFileSync(join(ROOT, dir, "package.json"), "utf8"));
  return pkg.version as string;
}

function changelogPath(dir: string): string {
  return join(ROOT, dir, "CHANGELOG.md");
}

if (!process.env.GIT_TOKEN) {
  console.error(
    "GIT_TOKEN is not set. It's required for npm.pkg.github.com auth (see .npmrc). Aborting.",
  );
  process.exit(1);
}

console.log(`Interview SDK release${DRY_RUN ? " (dry run)" : ""}\n`);

const before = Object.fromEntries(PACKAGES.map((p) => [p.dir, readVersion(p.dir)]));
const changelogExistedBefore = Object.fromEntries(
  PACKAGES.map((p) => [p.dir, existsSync(changelogPath(p.dir))]),
);

console.log("Step 1/4: choose package(s) and bump type\n");
run(["bunx", "changeset"]);

console.log("\nStep 2/4: applying version bumps\n");
run(["bunx", "changeset", "version"]);

const changed = PACKAGES.filter((p) => readVersion(p.dir) !== before[p.dir]);

if (changed.length === 0) {
  console.log("\nNo package versions changed, nothing to build or publish.");
  process.exit(0);
}

console.log(`\nStep 3/4: build ${changed.map((p) => p.name).join(", ")}\n`);
for (const pkg of changed) {
  run(["bun", "run", "build"], join(ROOT, pkg.dir));
}

if (DRY_RUN) {
  console.log("\nStep 4/4: publishing (dry run)\n");
  for (const pkg of changed) {
    run(["npm", "publish", "--dry-run"], join(ROOT, pkg.dir));
  }
  console.log("\nDry run complete, nothing was published. Reverting local version bump/changelog:\n");
  for (const pkg of changed) {
    run(["git", "checkout", "--", join(pkg.dir, "package.json")]);
    if (!changelogExistedBefore[pkg.dir]) {
      rmSync(changelogPath(pkg.dir), { force: true });
    } else {
      run(["git", "checkout", "--", changelogPath(pkg.dir)]);
    }
  }
  console.log("Working tree restored to how it was before the dry run.");
} else {
  console.log("\nStep 4/4: publishing\n");
  run(["bunx", "changeset", "publish"]);
  console.log(
    "\nDone. package.json/CHANGELOG.md changes are left uncommitted, review and commit them yourself:\n",
  );
  for (const pkg of changed) {
    console.log(`  ${pkg.name}: ${before[pkg.dir]} -> ${readVersion(pkg.dir)}`);
  }
}
