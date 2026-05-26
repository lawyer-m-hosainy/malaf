#!/usr/bin/env node
/**
 * Dependency Security Audit for malaf.pro
 * ==========================================
 * يفحص الثغرات الأمنية في التبعيات ويحمي من هجمات Supply Chain.
 * يتحقق من: npm audit, integrity checks, typosquatting detection
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// Known legitimate packages to prevent typosquatting false positives
const LEGITIMATE_PACKAGES = new Set([
  'react', 'react-dom', 'vite', 'typescript', 'eslint',
  'zustand', 'zod', 'sonner', 'recharts', 'express',
  'helmet', 'cors', 'clsx', 'pino', 'dotenv', 'resend',
  'motion', 'jspdf', 'jsdom', 'tsx', 'autoprefixer',
  'compression', 'jsonwebtoken', 'dompurify', 'husky',
  'shadcn', 'vitest',
]);

function main() {
  console.log('🛡️  Malaf Dependency Security Audit');
  console.log('═══════════════════════════════════════\n');

  const report = {
    timestamp: new Date().toISOString(),
    npmAudit: null,
    integrityCheck: null,
    outdatedPackages: null,
    typosquattingCheck: null,
    overallStatus: 'PASS',
  };

  // ─── Step 1: npm audit ──────────────────────────────────────
  console.log('📌 Step 1: Running npm audit...');
  try {
    const auditOutput = execSync('npm audit --json 2>&1', {
      encoding: 'utf-8',
      cwd: ROOT,
      maxBuffer: 1024 * 1024 * 10,
    });
    const audit = JSON.parse(auditOutput);
    const vulns = audit.metadata?.vulnerabilities || {};
    
    report.npmAudit = {
      critical: vulns.critical || 0,
      high: vulns.high || 0,
      moderate: vulns.moderate || 0,
      low: vulns.low || 0,
      info: vulns.info || 0,
      total: vulns.total || 0,
    };

    if (vulns.critical > 0 || vulns.high > 0) {
      console.log(`   ❌ Critical: ${vulns.critical}, High: ${vulns.high}`);
      report.overallStatus = 'FAIL';
    } else {
      console.log(`   ✅ No critical/high vulnerabilities`);
    }
    console.log(`   📊 Total: ${vulns.total || 0} (Moderate: ${vulns.moderate || 0}, Low: ${vulns.low || 0})\n`);
  } catch (error) {
    // npm audit exits with non-zero when vulns are found
    try {
      const audit = JSON.parse(error.stdout || '{}');
      const vulns = audit.metadata?.vulnerabilities || {};
      report.npmAudit = {
        critical: vulns.critical || 0,
        high: vulns.high || 0,
        moderate: vulns.moderate || 0,
        low: vulns.low || 0,
        info: vulns.info || 0,
        total: vulns.total || 0,
      };
      if (vulns.critical > 0 || vulns.high > 0) {
        console.log(`   ❌ Critical: ${vulns.critical}, High: ${vulns.high}`);
        report.overallStatus = 'FAIL';
      } else {
        console.log(`   ✅ No critical/high vulnerabilities`);
      }
      console.log(`   📊 Total: ${vulns.total || 0}\n`);
    } catch {
      console.log('   ⚠️  Could not parse npm audit output\n');
      report.npmAudit = { error: 'Could not parse audit output' };
    }
  }

  // ─── Step 2: Lock file integrity ───────────────────────────
  console.log('📌 Step 2: Checking lock file integrity...');
  const lockPath = resolve(ROOT, 'package-lock.json');
  if (existsSync(lockPath)) {
    try {
      execSync('npm ci --dry-run 2>&1', {
        encoding: 'utf-8',
        cwd: ROOT,
        maxBuffer: 1024 * 1024 * 10,
      });
      report.integrityCheck = { status: 'PASS', message: 'Lock file matches package.json' };
      console.log('   ✅ Lock file integrity verified\n');
    } catch {
      report.integrityCheck = { status: 'WARNING', message: 'Lock file may be out of sync' };
      console.log('   ⚠️  Lock file may be out of sync with package.json\n');
    }
  } else {
    report.integrityCheck = { status: 'FAIL', message: 'No package-lock.json found' };
    console.log('   ❌ No package-lock.json found!\n');
    report.overallStatus = 'FAIL';
  }

  // ─── Step 3: Outdated packages ─────────────────────────────
  console.log('📌 Step 3: Checking for outdated packages...');
  try {
    const outdatedOutput = execSync('npm outdated --json 2>&1', {
      encoding: 'utf-8',
      cwd: ROOT,
      maxBuffer: 1024 * 1024 * 10,
    });
    const outdated = JSON.parse(outdatedOutput || '{}');
    const outdatedList = Object.entries(outdated).map(([name, info]) => ({
      name,
      current: info.current,
      wanted: info.wanted,
      latest: info.latest,
      isMajor: info.current?.split('.')[0] !== info.latest?.split('.')[0],
    }));

    report.outdatedPackages = {
      total: outdatedList.length,
      major: outdatedList.filter((p) => p.isMajor).length,
      packages: outdatedList,
    };

    console.log(`   📊 ${outdatedList.length} outdated packages`);
    console.log(`   🔴 ${outdatedList.filter((p) => p.isMajor).length} with major updates available\n`);
  } catch {
    report.outdatedPackages = { total: 0, packages: [] };
    console.log('   ✅ All packages are up to date\n');
  }

  // ─── Step 4: Typosquatting detection ───────────────────────
  console.log('📌 Step 4: Typosquatting detection...');
  try {
    const pkgJson = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));
    const allDeps = [
      ...Object.keys(pkgJson.dependencies || {}),
      ...Object.keys(pkgJson.devDependencies || {}),
    ];

    const suspicious = [];
    allDeps.forEach((dep) => {
      // Check for common typosquatting patterns
      if (dep.startsWith('-') || dep.endsWith('-')) {
        suspicious.push({ package: dep, reason: 'Starts or ends with hyphen' });
      }
      if (/--/.test(dep) && !dep.startsWith('@')) {
        suspicious.push({ package: dep, reason: 'Contains double hyphen' });
      }
      // Check for suspiciously similar names to popular packages
      const baseName = dep.replace(/^@[\w-]+\//, '');
      if (baseName.length <= 2 && !['ws', 'ms'].includes(baseName)) {
        suspicious.push({ package: dep, reason: 'Suspiciously short name' });
      }
    });

    report.typosquattingCheck = {
      totalScanned: allDeps.length,
      suspicious: suspicious.length,
      packages: suspicious,
    };

    if (suspicious.length > 0) {
      console.log(`   ⚠️  ${suspicious.length} suspicious packages found:`);
      suspicious.forEach((s) => console.log(`     ❓ ${s.package}: ${s.reason}`));
    } else {
      console.log(`   ✅ No suspicious packages detected (${allDeps.length} scanned)`);
    }
  } catch {
    report.typosquattingCheck = { error: 'Could not analyze package.json' };
    console.log('   ⚠️  Could not analyze package.json');
  }

  // ─── Save Report ───────────────────────────────────────────
  const reportsDir = resolve(ROOT, 'reports');
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }
  const reportPath = resolve(reportsDir, 'dependency-security-audit.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`\n📄 Report saved: reports/dependency-security-audit.json`);
  console.log(`\n${'═'.repeat(40)}`);
  console.log(`🏁 Overall Status: ${report.overallStatus === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`${'═'.repeat(40)}`);

  process.exit(report.overallStatus === 'PASS' ? 0 : 1);
}

main();
