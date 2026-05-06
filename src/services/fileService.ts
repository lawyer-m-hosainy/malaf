import { supabase } from "@/lib/supabase";
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
const BUCKET_NAME = "documents";

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
    const orgId = getCurrentTenantId();
    const { data: user } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      org_id: orgId,
      user_id: user?.user?.id || null,
      action: "document_upload",
      entity_type: "cases",
      entity_id: caseId,
      details: {
        info: `Uploaded file for case ${caseId}`,
        fileName: sanitizeFileName(file.name),
        fileSize: file.size,
        fileType: file.type,
        storagePath: path,
      },
    });
  } catch {
    // Non-blocking
  }
}

async function ensureBucketExists() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === BUCKET_NAME)) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true, // We'll assume public bucket with RLS or signed URLs if needed. For now, matching previous behavior.
        fileSizeLimit: MAX_FILE_SIZE_BYTES
      });
    }
  } catch (e) {
    console.error("Failed to check/create bucket", e);
  }
}

export async function uploadFile(file: File, path: string): Promise<string> {
  validateUpload(file);
  await ensureBucketExists();

  const tenantId = getCurrentTenantId();
  const { data: user } = await supabase.auth.getUser();

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    logEvent("error", { event: "file_upload_failed", context: { path, error: error.message } });
    throw new Error(error.message);
  }

  logEvent("info", { event: "file_upload_success", context: { path } });
  
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
}

export function buildCaseUploadPath(caseId: string, fileName: string) {
  const tenantId = getCurrentTenantId();
  const safeName = sanitizeFileName(fileName);
  return `${tenantId}/${caseId}/${Date.now()}_${safeName}`;
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
      throw new Error("انتهت مهلة رفع الملف. يرجى التحقق من الاتصال.");
    }
    throw error;
  }
}
