import { auth, db, storage } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getCurrentTenantId } from "@/lib/tenant";
import { logEvent } from "@/observability/logger";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB demo-safe limit
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx", "txt"]);

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getFileExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function validateUpload(file: File) {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }
  const ext = getFileExtension(file.name);
  if (!ALLOWED_MIME_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error("FILE_TYPE_NOT_ALLOWED");
  }
}

async function writeUploadAudit(caseId: string, path: string, file: File) {
  try {
    await addDoc(collection(db, "audit_logs"), {
      tenantId: getCurrentTenantId(),
      userId: auth.currentUser?.uid || "unknown",
      action: "document_upload",
      module: "cases",
      details: `Uploaded file for case ${caseId}`,
      fileName: sanitizeFileName(file.name),
      fileSize: file.size,
      fileType: file.type,
      storagePath: path,
      timestamp: serverTimestamp(),
    });
  } catch {
    // Non-blocking for UX; upload should not fail because audit write fails.
  }
}

export async function uploadFile(file: File, path: string): Promise<string> {
  validateUpload(file);
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      tenantId: getCurrentTenantId(),
      uploadedBy: auth.currentUser?.uid || "unknown",
      originalName: sanitizeFileName(file.name),
      uploadedAt: new Date().toISOString(),
    },
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        logEvent("info", { event: "file_upload_progress", context: { progress: Math.round(progress), path } });
      },
      (error) => {
        logEvent("error", { event: "file_upload_failed", context: { path, error: error.message } });
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}

export function buildCaseUploadPath(caseId: string, fileName: string) {
  const tenantId = getCurrentTenantId();
  const safeName = sanitizeFileName(fileName);
  return `tenants/${tenantId}/cases/${caseId}/${Date.now()}_${safeName}`;
}

export async function uploadCaseDocument(file: File, caseId: string) {
  const path = buildCaseUploadPath(caseId, file.name);

  // Wrap upload in a timeout to prevent indefinite spinning
  const UPLOAD_TIMEOUT_MS = 15_000; // 15 seconds
  const uploadPromise = uploadFile(file, path);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("UPLOAD_TIMEOUT")), UPLOAD_TIMEOUT_MS)
  );

  try {
    const url = await Promise.race([uploadPromise, timeoutPromise]);
    await writeUploadAudit(caseId, path, file);
    return { url, path };
  } catch (error) {
    if (error instanceof Error && error.message === "UPLOAD_TIMEOUT") {
      throw new Error("انتهت مهلة رفع الملف. يرجى التحقق من الاتصال أو إعدادات Firebase Storage.");
    }
    throw error;
  }
}
