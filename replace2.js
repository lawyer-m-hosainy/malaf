import fs from 'fs';

let content = fs.readFileSync('src/services/legalDataService.ts', 'utf-8');

const replacements = [
  { match: /from\("eta_invoices"\)\s*\n\s*\.select\("\*"\)/g, replace: 'from("eta_invoices")\n      .select("id, org_id, amount, status, created_at")' },
  { match: /from\("conflict_checks"\)\s*\n\s*\.select\("\*"\)/g, replace: 'from("conflict_checks")\n      .select("id, org_id, entity_name, check_date, status, created_at")' },
  { match: /from\("wiki_articles"\)\s*\n\s*\.select\("\*"\)/g, replace: 'from("wiki_articles")\n      .select("id, org_id, title, content, created_at")' },
  { match: /from\(table\)\s*\n\s*\.select\("\*"\)/g, replace: 'from(table)\n      .select("id, org_id, created_at") // Dynamic table select' },
  { match: /from\("consultations"\)\s*\n\s*\.select\("\*"\)/g, replace: 'from("consultations")\n      .select("id, org_id, title, status, created_at")' },
  { match: /from\("execution_requests"\)\s*\n\s*\.select\("\*"\)/g, replace: 'from("execution_requests")\n      .select("id, org_id, case_id, status, created_at")' },
  { match: /from\("investigations"\)\s*\n\s*\.select\("\*"\)/g, replace: 'from("investigations")\n      .select("id, org_id, case_id, status, created_at")' },
  { match: /from\("legal_opinions"\)\s*\n\s*\.select\("\*"\)/g, replace: 'from("legal_opinions")\n      .select("id, org_id, title, content, status, created_at")' },
  { match: /from\("agreements"\)\s*\n\s*\.select\("\*"\)/g, replace: 'from("agreements")\n      .select("id, org_id, title, status, created_at")' },
  { match: /from\("memos"\)\s*\n\s*\.select\("\*"\)/g, replace: 'from("memos")\n      .select("id, org_id, case_id, title, content, created_at")' },
  { match: /from\("notifications"\)\s*\n\s*\.select\("\*"\)/g, replace: 'from("notifications")\n      .select("id, organization_id, user_id, title, body, type, is_read, case_id, created_at")' },
  { match: /from\("timeline_events"\)\s*\n\s*\.select\("\*"\)/g, replace: 'from("timeline_events")\n      .select("id, organization_id, case_id, event_type, description, event_date, created_by")' },
  { match: /from\("case_history"\)\s*\n\s*\.select\("\*"\)/g, replace: 'from("case_history")\n      .select("id, org_id, case_id, action, created_at")' },
];

replacements.forEach(r => {
  content = content.replace(r.match, r.replace);
});

fs.writeFileSync('src/services/legalDataService.ts', content, 'utf-8');
console.log('Replaced all remaining selects');
