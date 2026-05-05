const fs = require('fs');
const files = ['AIDocumentAnalyzer','Analytics','AuditLogs','BDDashboard','Calendar','ClientPortal','Compliance','ConflictCheck','Contracts','CRM','ESignatures','InternalWiki','Landing','LegalLibrary','LegalQA','PortalManagement','Settings','TimeTracking','TrainingPortal'];

files.forEach(f => {
  const p = `src/views/${f}.tsx`;
  let c = fs.readFileSync(p, 'utf8');
  let regex = /\$match\s*=\s*(import\s+.*?["'])/;
  let match = c.match(regex);
  if (match) {
    let idx = match.index;
    let correct = c.substring(idx + match[0].length - match[1].length);
    fs.writeFileSync(p, correct);
    console.log('Fixed', f);
  } else {
    // maybe we already fixed it manually like Settings.tsx or TrainingPortal
    console.log('Skipped', f, 'no $match found');
  }
});
