#!/usr/bin/env bun
import fs from 'fs/promises';
import { execSync } from 'child_process';
import readline from 'readline';

const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const releaseTypes = new Set(['major', 'minor']);
const packages = [
  { name: '@imminently/interview-sdk', path: 'packages/core' },
  { name: '@imminently/interview-ui', path: 'packages/ui' }
];

function readJSON(path) {
  return fs.readFile(path, 'utf8').then(JSON.parse);
}

function writeJSON(path, obj) {
  return fs.writeFile(path, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

function parseSemver(version) {
  const m = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.*))?$/);
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]), rest: m[4] };
}

function compareSemver(left, right) {
  if (left.major !== right.major) return left.major - right.major;
  if (left.minor !== right.minor) return left.minor - right.minor;
  return left.patch - right.patch;
}

function formatSemver(version) {
  return `${version.major}.${version.minor}.${version.patch}`;
}

function nextVersion(version, releaseType) {
  if (releaseType === 'major') {
    return { major: version.major + 1, minor: 0, patch: 0 };
  }

  return { major: version.major, minor: version.minor + 1, patch: 0 };
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const releaseType = args.find((arg) => releaseTypes.has(arg));

  if (!releaseType) {
    console.error('Usage: bun ./scripts/release-major.js <major|minor> [--dry-run]');
    process.exit(1);
  }

  return {
    releaseType,
    dryRun: args.includes('--dry-run')
  };
}

async function main() {
  try {
    const { releaseType, dryRun } = parseArgs(process.argv);

    // Read current versions
    const pkgInfos = [];
    for (const p of packages) {
      const file = `${p.path}/package.json`;
      const data = await readJSON(file);
      const version = parseSemver(data.version);
      if (!version) {
        console.error(`Invalid version in ${file}: ${data.version}`);
        process.exit(1);
      }

      pkgInfos.push({ ...p, file, version: data.version, parsedVersion: version });
    }

    console.log('Current package versions:');
    pkgInfos.forEach(p => console.log(` - ${p.name}: ${p.version}`));

    const highestVersion = pkgInfos.reduce((highest, current) => (
      compareSemver(current.parsedVersion, highest) > 0 ? current.parsedVersion : highest
    ), pkgInfos[0].parsedVersion);
    const targetVersion = formatSemver(nextVersion(highestVersion, releaseType));

    console.log(`Next shared ${releaseType} version: ${targetVersion}`);

    // Confirm
    const confirm = (await prompt(`Confirm ${dryRun ? 'dry run for ' : ''}${releaseType} release to version ${targetVersion}? (y/N) `)).trim().toLowerCase();
    if (confirm !== 'y' && confirm !== 'yes') {
      console.log('Aborted by user.');
      process.exit(0);
    }

    if (dryRun) {
      console.log('Dry run complete. No files were changed, built, or published.');
      process.exit(0);
    }

    // Update package.json files
    for (const p of pkgInfos) {
      const json = await readJSON(p.file);
      json.version = targetVersion;
      await writeJSON(p.file, json);
      console.log(`Updated ${p.file} -> version ${targetVersion}`);
    }

    // Run builds and publish
    for (const p of packages) {
      const cwd = `${root}/${p.path}`;
      console.log(`\nBuilding ${p.name} in ${p.path}...`);
      try {
        execSync('bun run build', { cwd, stdio: 'inherit' });
      } catch (e) {
        console.error(`Build failed for ${p.name}`);
        throw e;
      }

      console.log(`Publishing ${p.name}...`);
      try {
        execSync('bun publish', { cwd, stdio: 'inherit' });
      } catch (e) {
        console.error(`Publish failed for ${p.name}`);
        throw e;
      }
    }

    console.log('\nAll done.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('release-major.js')) {
  main();
}
