#!/usr/bin/env node
/**
 * License Compliance Checker for malaf.pro
 * ==========================================
 * يفحص تراخيص جميع المكتبات ويضمن التوافق التجاري.
 * التراخيص المسموحة: MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0, 0BSD, CC0-1.0, Unlicense, BlueOak-1.0.0
 * التراخيص المحظورة: GPL, AGPL, SSPL, EUPL, CC-BY-SA (copyleft licenses)
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Configuration ───────────────────────────────────────────
const ALLOWED_LICENSES = [
  'MIT',
  'ISC',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'Apache-2.0',
  '0BSD',
  'CC0-1.0',
  'Unlicense',
  'BlueOak-1.0.0',
  'Python-2.0',
  'CC-BY-4.0',
  'CC-BY-3.0',
  'Artistic-2.0',
  'Zlib',
  'MIT*',
  '(MIT OR Apache-2.0)',
  '(MIT OR CC0-1.0)',
  '(BSD-2-Clause OR MIT OR Apache-2.0)',
  '(MIT AND Zlib)',
  '(MIT AND BSD-3-Clause)',
  '(Apache-2.0 OR MIT)',
  'WTFPL',
  'OFL-1.1',
  'MPL-2.0',
];

const BLOCKED_LICENSES = [
  'GPL',
  'GPL-2.0',
  'GPL-3.0',
  'AGPL',
  'AGPL-3.0',
  'LGPL',
  'LGPL-2.1',
  'LGPL-3.0',
  'SSPL',
  'EUPL',
  'CC-BY-SA',
  'CC-BY-SA-4.0',
  'CC-BY-NC',
  'CC-BY-NC-4.0',
];

// Known exceptions — packages with custom or unclear licenses that have been manually verified
const EXCEPTIONS = {
  // Add packages that have been manually reviewed
  // 'package-name': 'Reason for exception',
};

// ─── Main ────────────────────────────────────────────────────
function main() {
  console.log('🔍 Malaf License Compliance Checker');
  console.log('═══════════════════════════════════════\n');

  let rawOutput;
  try {
    rawOutput = execSync(
      'npx license-checker --json --production --excludePrivatePackages',
      { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10, cwd: resolve(__dirname, '..') }
    );
  } catch (error) {
    console.error('❌ Failed to run license-checker. Install it with: npm install -g license-checker');
    process.exit(1);
  }

  const packages = JSON.parse(rawOutput);
  const results = {
    total: 0,
    allowed: [],
    blocked: [],
    unknown: [],
    exceptions: [],
    timestamp: new Date().toISOString(),
  };

  for (const [pkg, info] of Object.entries(packages)) {
    results.total++;
    const licenses = String(info.licenses || 'UNKNOWN');

    // Check exceptions
    const pkgName = pkg.replace(/@[\d.]+$/, '');
    if (EXCEPTIONS[pkgName]) {
      results.exceptions.push({ package: pkg, licenses, reason: EXCEPTIONS[pkgName] });
      continue;
    }

    // Check blocked
    const isBlocked = BLOCKED_LICENSES.some(
      (bl) => licenses.includes(bl) && !licenses.includes('MIT')
    );
    if (isBlocked) {
      results.blocked.push({ package: pkg, licenses, repository: info.repository || 'N/A' });
      continue;
    }

    // Check allowed
    const isAllowed = ALLOWED_LICENSES.some((al) => licenses.includes(al));
    if (isAllowed) {
      results.allowed.push({ package: pkg, licenses });
      continue;
    }

    // Unknown
    results.unknown.push({ package: pkg, licenses, repository: info.repository || 'N/A' });
  }

  // ─── Report ──────────────────────────────────────────────────
  console.log(`📦 Total packages scanned: ${results.total}`);
  console.log(`✅ Allowed: ${results.allowed.length}`);
  console.log(`❌ Blocked: ${results.blocked.length}`);
  console.log(`⚠️  Unknown: ${results.unknown.length}`);
  console.log(`🔑 Exceptions: ${results.exceptions.length}\n`);

  if (results.blocked.length > 0) {
    console.log('══════════════════════════════════════');
    console.log('❌ BLOCKED PACKAGES (Copyleft Licenses):');
    console.log('══════════════════════════════════════');
    results.blocked.forEach((p) => {
      console.log(`  ⛔ ${p.package}`);
      console.log(`     License: ${p.licenses}`);
      console.log(`     Repo: ${p.repository}\n`);
    });
  }

  if (results.unknown.length > 0) {
    console.log('══════════════════════════════════════');
    console.log('⚠️  UNKNOWN LICENSES (Manual Review Required):');
    console.log('══════════════════════════════════════');
    results.unknown.forEach((p) => {
      console.log(`  ❓ ${p.package}`);
      console.log(`     License: ${p.licenses}`);
      console.log(`     Repo: ${p.repository}\n`);
    });
  }

  // Save report
  const reportsDir = resolve(__dirname, '..', 'reports');
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }
  const reportPath = resolve(reportsDir, 'license-compliance-report.json');
  writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n📄 Full report saved to: reports/license-compliance-report.json`);

  // Exit code
  if (results.blocked.length > 0) {
    console.log('\n🚨 LICENSE COMPLIANCE FAILED — Blocked packages found!');
    process.exit(1);
  }

  if (results.unknown.length > 5) {
    console.log('\n⚠️  WARNING: Too many unknown licenses. Please review manually.');
    process.exit(1);
  }

  console.log('\n✅ LICENSE COMPLIANCE PASSED');
  process.exit(0);
}

main();
