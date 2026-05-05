import { readFile } from "node:fs/promises";
import path from "node:path";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { collection, deleteDoc, doc, getDocs, getFirestore, query, where } from "firebase/firestore";

const DEMO_TENANT_ID = "demo-tenant";

async function loadFirebaseConfig() {
  const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
  const raw = await readFile(configPath, "utf8");
  return JSON.parse(raw);
}

async function removeCollectionDocsByTenant(db: any, collectionName: string, tenantId: string) {
  const snapshot = await getDocs(query(collection(db, collectionName), where("tenantId", "==", tenantId)));
  for (const d of snapshot.docs) {
    await deleteDoc(doc(db, collectionName, d.id));
  }
  return snapshot.docs.length;
}

async function resetDemo() {
  const email = process.env.DEMO_ADMIN_EMAIL;
  const password = process.env.DEMO_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing DEMO_ADMIN_EMAIL or DEMO_ADMIN_PASSWORD environment variables.");
  }

  const cfg = await loadFirebaseConfig();
  const app = initializeApp(cfg);
  const auth = getAuth(app);
  const db = getFirestore(app, cfg.firestoreDatabaseId);

  console.log("Authenticating demo admin...");
  await signInWithEmailAndPassword(auth, email, password);

  const collections = ["clients", "cases", "invoices", "trustAccounts", "enforcement", "tasks", "team"];
  
  console.log("Cleaning up collections...");
  for (const col of collections) {
      const count = await removeCollectionDocsByTenant(db, col, DEMO_TENANT_ID);
      console.log(`- Deleted ${count} items from ${col}`);
  }

  console.log(`Reset complete for tenant ${DEMO_TENANT_ID}.`);
}

resetDemo().catch((err) => {
  console.error("Demo reset failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
