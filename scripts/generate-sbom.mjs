#!/usr/bin/env node
/**
 * SBOM Generator for malaf.pro
 * ===============================
 * Generates a CycloneDX SBOM in JSON format for supply chain transparency.
 * Output: reports/sbom.json
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

function main() {
  console.log('📋 Malaf SBOM Generator (CycloneDX)');
  console.log('═══════════════════════════════════════\n');

  const reportsDir = resolve(ROOT, 'reports');
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }

  const sbomPath = resolve(reportsDir, 'sbom.json');

  try {
    // Generate CycloneDX SBOM
    execSync(
      `npx @cyclonedx/cyclonedx-npm --output-file "${sbomPath}" --spec-version 1.5 --output-reproducible`,
      {
        encoding: 'utf-8',
        cwd: ROOT,
        stdio: 'pipe',
        maxBuffer: 1024 * 1024 * 50,
      }
    );

    console.log('✅ SBOM generated successfully!');
    console.log(`📄 Output: reports/sbom.json`);

    // Parse and summarize
    if (existsSync(sbomPath)) {
      const sbom = JSON.parse(readFileSync(sbomPath, 'utf-8'));
      const componentCount = sbom.components?.length || 0;

      console.log(`\n📊 SBOM Summary:`);
      console.log(`   Format: CycloneDX ${sbom.specVersion || '1.5'}`);
      console.log(`   Components: ${componentCount}`);
      console.log(`   Generated: ${new Date().toISOString()}`);

      // Generate a human-readable summary
      const summaryPath = resolve(reportsDir, 'sbom-summary.md');
      const summary = generateMarkdownSummary(sbom);
      writeFileSync(summaryPath, summary, 'utf-8');
      console.log(`   Summary: reports/sbom-summary.md`);
    }
  } catch (error) {
    console.error('❌ SBOM generation failed:', error.message);
    console.error('   Try: npx @cyclonedx/cyclonedx-npm --help');
    process.exit(1);
  }
}

function generateMarkdownSummary(sbom) {
  const components = sbom.components || [];
  const timestamp = new Date().toISOString();

  // Group by type
  const byType = {};
  components.forEach((c) => {
    const type = c.type || 'unknown';
    if (!byType[type]) byType[type] = [];
    byType[type].push(c);
  });

  // Collect unique licenses
  const licenseSet = new Set();
  components.forEach((c) => {
    (c.licenses || []).forEach((l) => {
      const id = l.license?.id || l.license?.name || l.expression || 'Unknown';
      licenseSet.add(id);
    });
  });

  let md = `# Malaf.pro — Software Bill of Materials (SBOM)\n\n`;
  md += `> Auto-generated on ${timestamp}\n\n`;
  md += `## Summary\n\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += `| Format | CycloneDX ${sbom.specVersion || 'N/A'} |\n`;
  md += `| Total Components | ${components.length} |\n`;
  md += `| Unique Licenses | ${licenseSet.size} |\n`;
  md += `| Serial Number | ${sbom.serialNumber || 'N/A'} |\n\n`;

  md += `## Components by Type\n\n`;
  for (const [type, pkgs] of Object.entries(byType)) {
    md += `### ${type} (${pkgs.length})\n\n`;
    md += `| Package | Version | License |\n|---------|---------|----------|\n`;
    pkgs.slice(0, 50).forEach((p) => {
      const license =
        p.licenses?.map((l) => l.license?.id || l.expression || 'N/A').join(', ') || 'N/A';
      md += `| ${p.name || 'N/A'} | ${p.version || 'N/A'} | ${license} |\n`;
    });
    if (pkgs.length > 50) {
      md += `| ... | ${pkgs.length - 50} more | ... |\n`;
    }
    md += `\n`;
  }

  md += `## License Distribution\n\n`;
  md += `| License | Count |\n|---------|-------|\n`;
  const licenseCounts = {};
  components.forEach((c) => {
    (c.licenses || []).forEach((l) => {
      const id = l.license?.id || l.expression || 'Unknown';
      licenseCounts[id] = (licenseCounts[id] || 0) + 1;
    });
  });
  Object.entries(licenseCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([license, count]) => {
      md += `| ${license} | ${count} |\n`;
    });

  return md;
}

main();
