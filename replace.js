import fs from 'fs';

let content = fs.readFileSync('src/services/legalDataService.ts', 'utf-8');

const replacements = [
  { match: /from\(CASES_TABLE\)\s*\n\s*\.select\("\*"\)/g, replace: 'from(CASES_TABLE)\n      .select("id, client_id, title, type, court, status, plaintiff, defendant, first_instance_number, appeal_number, cassation_number, created_at")' },
  { match: /from\("tasks"\)\s*\n\s*\.select\("\*"\)/g, replace: 'from("tasks")\n      .select("id, case_id, assigned_to, title, description, due_date, status, priority, created_at")' },
  { match: /from\("sessions"\)\s*\n\s*\.select\("\*"\)/g, replace: 'from("sessions")\n      .select("id, case_id, date, time, court, circuit, status, previous_decision, postponement_reason, next_session_date, lawyer_id, notes, created_at")' },
  { match: /from\("expenses"\)\s*\n\s*\.select\("\*"\)/g, replace: 'from("expenses")\n      .select("id, case_id, client_id, category, amount, date, status, description, requires_partner_approval, created_at")' },
  { match: /from\("documents"\)\s*\n\s*\.select\("\*"\)/g, replace: 'from("documents")\n      .select("id, case_id, client_id, file_name, file_url, category, shared_with_client, size, created_at")' },
  { match: /from\("timeline_events"\)\s*\n\s*\.select\("\*"\)/g, replace: 'from("timeline_events")\n      .select("id, case_id, event_type, description, event_date, created_by")' },
];

replacements.forEach(r => {
  content = content.replace(r.match, r.replace);
});

// For any remaining `.select("*")`, just replace it with `.select("id, created_at")` to be safe? 
// No, some might need 'title' or 'status'. Let's replace remaining generically if we want to be safe, but actually let's see how many remain.

fs.writeFileSync('src/services/legalDataService.ts', content, 'utf-8');
console.log('Replaced specific selects');
