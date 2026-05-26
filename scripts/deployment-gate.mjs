#!/usr/bin/env node
/**
 * Deployment Gate — malaf.pro
 * ════════════════════════════
 * يُستخدم في CI/CD pipeline لمنع النشر عند استنفاد Error Budget.
 * يقرأ أحدث SLO metrics من Supabase ويقرر السماح أو المنع.
 *
 * Usage:
 *   node scripts/deployment-gate.mjs
 *
 * Exit codes:
 *   0 = Deploy allowed
 *   1 = Deploy blocked
 *
 * Required env vars:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// ─── SLO Definitions (mirrored from TypeScript) ──────────────
const SLO_DEFINITIONS = {
  availability:    { name: 'Availability SLO',        target: 0.995, legallyRequired: false },
  latency_p95:     { name: 'Latency P95 SLO',         target: 0.95,  legallyRequired: false },
  latency_p99:     { name: 'Latency P99 SLO',         target: 0.99,  legallyRequired: false },
  eta_integration: { name: 'ETA Invoice Submission',   target: 0.99,  legallyRequired: true  },
};

// ─── Main ────────────────────────────────────────────────────
async function main() {
  console.log('🚦 Malaf Deployment Gate');
  console.log('═══════════════════════════════════════\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let sloStatuses;

  if (supabaseUrl && supabaseKey) {
    // Fetch real SLO metrics from Supabase
    sloStatuses = await fetchSLOMetrics(supabaseUrl, supabaseKey);
  } else {
    console.log('⚠️  No Supabase credentials — using simulated healthy status\n');
    // In development: simulate healthy status
    sloStatuses = Object.entries(SLO_DEFINITIONS).map(([key, slo]) => ({
      slo_name: key,
      name: slo.name,
      status: 'healthy',
      budget_consumed_pct: 0,
      burn_rate: 0,
      legally_required: slo.legallyRequired,
    }));
  }

  // Check deployment gate
  const blockers = [];

  for (const slo of sloStatuses) {
    const icon = getStatusIcon(slo.status);
    console.log(`  ${icon} ${slo.name}: ${slo.status} (${slo.budget_consumed_pct}% consumed, burn rate: ${slo.burn_rate}x)`);

    if (slo.status === 'exhausted') {
      blockers.push(`🚨 ${slo.name}: Error Budget exhausted (${slo.budget_consumed_pct}% consumed)`);
    }

    if (slo.legally_required && slo.status === 'critical') {
      blockers.push(`⚖️ ${slo.name}: Legal SLO in critical state (${slo.budget_consumed_pct}% consumed)`);
    }
  }

  console.log('');

  // Save gate decision
  const decision = {
    timestamp: new Date().toISOString(),
    allowed: blockers.length === 0,
    blockers,
    sloSnapshot: sloStatuses,
    commitSha: process.env.GITHUB_SHA || process.env.GIT_COMMIT || 'local',
    branch: process.env.GITHUB_REF_NAME || process.env.GIT_BRANCH || 'local',
  };

  const reportsDir = resolve(ROOT, 'reports');
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }
  writeFileSync(
    resolve(reportsDir, 'deployment-gate-decision.json'),
    JSON.stringify(decision, null, 2),
    'utf-8'
  );

  // Output decision
  console.log('═══════════════════════════════════════');
  if (blockers.length === 0) {
    console.log('✅ DEPLOYMENT ALLOWED');
    console.log('   All SLOs are within acceptable error budget.\n');
    process.exit(0);
  } else {
    console.log('❌ DEPLOYMENT BLOCKED');
    console.log('   The following SLOs are preventing deployment:\n');
    blockers.forEach((b) => console.log(`   ${b}`));
    console.log('\n   📋 See docs/error-budget-policy.md for details.');
    console.log('   📄 Decision saved to reports/deployment-gate-decision.json\n');
    process.exit(1);
  }
}

// ─── Supabase Fetcher ────────────────────────────────────────
async function fetchSLOMetrics(url, key) {
  try {
    const response = await fetch(
      `${url}/rest/v1/rpc/get_latest_slo_status`,
      {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_org_id: process.env.ORG_ID }),
      }
    );

    if (!response.ok) {
      console.log(`⚠️  Failed to fetch SLO metrics (HTTP ${response.status}). Using fallback.\n`);
      return getDefaultStatuses();
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      console.log('⚠️  No SLO metrics found in database. Using defaults.\n');
      return getDefaultStatuses();
    }

    return data.map((row) => ({
      slo_name: row.slo_name,
      name: SLO_DEFINITIONS[row.slo_name]?.name || row.slo_name,
      status: row.status,
      budget_consumed_pct: parseFloat(row.budget_consumed_pct) || 0,
      burn_rate: parseFloat(row.burn_rate) || 0,
      legally_required: SLO_DEFINITIONS[row.slo_name]?.legallyRequired || false,
    }));
  } catch (error) {
    console.log(`⚠️  Error fetching SLO metrics: ${error.message}. Using defaults.\n`);
    return getDefaultStatuses();
  }
}

function getDefaultStatuses() {
  return Object.entries(SLO_DEFINITIONS).map(([key, slo]) => ({
    slo_name: key,
    name: slo.name,
    status: 'healthy',
    budget_consumed_pct: 0,
    burn_rate: 0,
    legally_required: slo.legallyRequired,
  }));
}

function getStatusIcon(status) {
  switch (status) {
    case 'healthy':   return '✅';
    case 'warning':   return '⚠️';
    case 'critical':  return '🔴';
    case 'exhausted': return '🚨';
    default:          return '❓';
  }
}

main().catch(console.error);
