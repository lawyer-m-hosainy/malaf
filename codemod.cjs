const fs = require('fs');
const path = require('path');

const storeMap = {
  "useAdvisoryStore": [
    "advisoryRequests","setAdvisoryRequests","addAdvisoryOpinion","updateAdvisoryStatus",
    "decideAdvisoryApproval","approvals"
  ],
  "useAnalyticsStore": [
    "getFinancialSummary","getAttorneyPerformance","getPracticeAreaStats",
    "executeConflictCheck","collectionRate","projectedRevenue","name","cases",
    "winningRate","value","entityName","relationshipType","relatedToId",
    "description","severity","id","checkedAt","checkedBy","status"
  ],
  "useAuthStore": [
    "currentUser","isDemoMode","setCurrentUser","setDemoMode","hasPermission"
  ],
  "useCasesStore": [
    "cases","sessions","deadlines","setCases","addCase","setSessions","addSession",
    "setDeadlines","addDeadline","updateDeadlineStatus"
  ],
  "useClientsStore": [
    "clients","leads","keyAccounts","proposals","setClients","addClient",
    "setLeads","addLead","setKeyAccounts","addKeyAccount","setProposals",
    "addProposal","updateProposalStatus"
  ],
  "useCLMStore": [
    "contractRequests","contracts","setContractRequests","setContracts",
    "addContractVersion","updateContractStage","decideContractApproval",
    "updateContractObligationStatus","obligations"
  ],
  "useComplianceStore": [
    "riskRegisters","controls","complianceIssues","regulatoryObligations","compliance",
    "precedents","qaReviews","conflictHistory","knowledgeAssets","specializedTracks",
    "trainingPathways","assessments","setRiskRegisters","setControls","setComplianceIssues",
    "setRegulatoryObligations","setCompliance","setPrecedents","setQAReviews",
    "addConflictRecord","setKnowledgeAssets","setSpecializedTracks","setTrainingPathways",
    "setAssessments","updateRiskStatus","updateComplianceIssueStatus","updateQAChecklist",
    "updateQAStatus","toggleSpecializedChecklist","updateSpecializedTrackStatus",
    "updateTrainingModuleStatus","checklist","modules","overallProgress"
  ],
  "useEnforcementStore": [
    "enforcementCases","setEnforcementCases","addEnforcementAction"
  ],
  "useFinanceStore": [
    "expenses","timeEntries","receivables","trustAccounts","pricingModels",
    "setExpenses","addExpense","setTimeEntries","setReceivables","addCollectionAction",
    "reconcileReceivable","closeReceivable","setTrustAccounts","setPricingModels"
  ],
  "useInvoicesStore": [
    "invoices","isLoading","error","loadInvoices","addInvoice","updateInvoiceStatus","removeInvoice"
  ],
  "useIPStore": [
    "ipFilings","ipRenewals","ipOppositions","ipEnforcementActions","ipRecords",
    "setIPFilings","setIPRenewals","setIPOppositions","setIPEnforcementActions",
    "setIPRecords","updateIPRenewalStatus","updateIPOppositionStatus","updateIPEnforcementStatus"
  ],
  "useTeamStore": [
    "teamMembers","tasks","setTeamMembers","setTasks","addTask","updateTaskStatus"
  ],
  "useUIStore": [
    "officeSettings","notifications","wikiArticles","workflows","auditLogs",
    "eSignatures","isSidebarOpen","toggleSidebar","closeSidebar","setOfficeSettings",
    "setNotifications","markNotificationAsRead","setWikiArticles","addWikiArticle",
    "setWorkflows","addAuditLog","setESignatures","officeName","registrationNumber",
    "address","phone","email","logoUrl","language"
  ]
};

// reverse map
const propToStore = {};
for (const [store, props] of Object.entries(storeMap)) {
  for (const prop of props) {
    if (!propToStore[prop]) {
      propToStore[prop] = store;
    }
  }
}

function findFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(findFiles(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('useAppStore')) return;
  if (filePath.endsWith('useAppStore.ts') || filePath.endsWith('store\\index.ts') || filePath.endsWith('store/index.ts')) return;

  console.log('Processing:', filePath);

  let newImports = new Set();
  
  // Replace destructuring
  const regex = /const\s+\{\s*([^}]+)\s*\}\s*=\s*useAppStore\(\);?/g;
  content = content.replace(regex, (match, propsGroup) => {
    const props = propsGroup.split(',').map(p => p.trim()).filter(Boolean);
    let replacements = [];
    props.forEach(p => {
      // Handle aliases e.g. "isDemoMode: demoMode"
      const parts = p.split(':').map(str => str.trim());
      const rawProp = parts[0];
      const aliasProp = parts[1] || parts[0];

      let store = propToStore[rawProp];
      if (!store) {
          // fallback if missing
          console.warn(`WARNING: Property '${rawProp}' not found in store mapping! Falling back to useUIStore as guess.`);
          store = 'useUIStore';
      }
      newImports.add(store);
      replacements.push(`const ${aliasProp} = ${store}((state) => state.${rawProp});`);
    });
    return replacements.join('\n  ');
  });

  if (newImports.size > 0) {
    // remove full import of useAppStore
    const appStoreRegex = /import\s+\{\s*useAppStore\s*\}\s+from\s+['"].*?useAppStore['"];?\n?/g;
    content = content.replace(appStoreRegex, '');

    // Add new imports below the last import statement or at top
    const importLines = Array.from(newImports).map(s => `import { ${s} } from '@/store/${s}';`).join('\n') + '\n';
    
    // Find the last import
    const lastImportMatch = content.match(/^import.*\n/gm);
    if (lastImportMatch && lastImportMatch.length > 0) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      content = content.replace(lastImport, lastImport + importLines);
    } else {
      content = importLines + content;
    }
  }

  // Handle direct non-destructured uses (if any)
  const directUsageMatches = content.match(/useAppStore\./g);
  if (directUsageMatches) {
     console.warn(`WARNING: Direct usage of useAppStore found in ${filePath}. Manual fix required.`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

const files = findFiles('./src');
files.forEach(processFile);
console.log('Codemod completed.');
