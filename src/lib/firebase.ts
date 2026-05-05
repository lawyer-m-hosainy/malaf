import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  errorCode: string;
  operationType: OperationType;
  path: string | null;
  requestId: string;
  authInfo: {
    userId: string | undefined;
    tenantId: string | null | undefined;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const errInfo: FirestoreErrorInfo = {
    errorCode: error instanceof Error ? error.name || 'UNKNOWN_FIRESTORE_ERROR' : 'UNKNOWN_FIRESTORE_ERROR',
    requestId,
    authInfo: {
      userId: auth.currentUser?.uid,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  }
  if (import.meta.env?.DEV) {
    console.error('Firestore Error', JSON.stringify(errInfo));
  } else {
    console.error('A database error occurred. Request ID:', requestId);
  }
  throw new Error(`تعذر تنفيذ العملية. رمز التتبع: ${requestId}`);
}
