#!/usr/bin/env bun
import fs from 'fs/promises';
import { execSync } from 'child_process';
import readline from 'readline';

const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
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

async function main() {
  try {
    // Read current versions
    const pkgInfos = [];
    for (const p of packages) {
      const file = `${p.path}/package.json`;
      const data = await readJSON(file);
      pkgInfos.push({ ...p, file, version: data.version });
    }

    console.log('Current package versions:');
    pkgInfos.forEach(p => console.log(` - ${p.name}: ${p.version}`));

    const answer = (await prompt('Enter desired new version (semver, major bump required): ')).trim();
    const parsed = parseSemver(answer);
    if (!parsed) {
      console.error('Invalid semver. Expect format MAJOR.MINOR.PATCH');
      process.exit(1);
    }

    const currentMajors = pkgInfos.map(p => parseSemver(p.version)?.major || 0);
    const maxCurrentMajor = Math.max(...currentMajors);
    if (parsed.major <= maxCurrentMajor) {
      console.error(`Provided major (${parsed.major}) is not greater than current max major (${maxCurrentMajor}). Aborting.`);
      process.exit(1);
    }

    // Confirm
    const confirm = (await prompt(`Confirm updating packages to version ${answer}? (y/N) `)).trim().toLowerCase();
    if (confirm !== 'y' && confirm !== 'yes') {
      console.log('Aborted by user.');
      process.exit(0);
    }

    // Update package.json files
    for (const p of pkgInfos) {
      const json = await readJSON(p.file);
      json.version = answer;
      await writeJSON(p.file, json);
      console.log(`Updated ${p.file} -> version ${answer}`);
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
