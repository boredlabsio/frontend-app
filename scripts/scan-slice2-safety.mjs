#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const forbiddenTracked = [
  /^\.env($|\.(?!example$))/,
  /^\.next\//,
  /^node_modules\//,
  /(^|\/)(logs?|tmp|temp)\//,
  /(^|\/)(artifacts|cache|out|coverage)\//,
  /api_summary_.*\.json$/
];

const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const allowedLegacyFiles = new Set(['public/api_summary_latest.json']);
const forbidden = files.filter((file) => !allowedLegacyFiles.has(file) && forbiddenTracked.some((pattern) => pattern.test(file)));
if (forbidden.length) {
  console.error(`Forbidden generated/local files are tracked:\n${forbidden.join('\n')}`);
  process.exit(1);
}

const secretAssignment = /(^|\n)\s*[A-Z0-9_]*(PRIVATE_KEY|SECRET|TOKEN|PASSWORD)[A-Z0-9_]*\s*=\s*["']?(?!false|true|0|1|<|your-|example|changeme|$)[A-Za-z0-9_./+=:-]{12,}/;
const privateKeyBlock = /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/;
const offenders = [];

for (const file of files) {
  if (!/\.(ts|tsx|js|mjs|json|md|env\.example)$/.test(file) && file !== '.env.example') continue;
  const text = readFileSync(file, 'utf8');
  if (privateKeyBlock.test(text) || secretAssignment.test(text)) offenders.push(file);
}

if (offenders.length) {
  console.error(`Potential committed secret values found:\n${offenders.join('\n')}`);
  process.exit(1);
}

console.log('Slice 2 safety scan passed');
