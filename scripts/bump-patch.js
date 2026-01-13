#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

async function main() {
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  const src = await fs.readFile(pkgPath, 'utf8');
  const pkg = JSON.parse(src);
  const ver = (pkg.version || '0.0.0').split('-')[0];
  const parts = ver.split('.').map((p) => Number(p) || 0);
  parts[2] = (parts[2] || 0) + 1;
  const newVer = `${parts[0]}.${parts[1]}.${parts[2]}`;
  pkg.version = newVer;
  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log('Bumped', pkgPath, '->', newVer);
}

main().catch((err) => { console.error(err); process.exit(1); });
