/**
 * Firebase Cloud Functions — Email Notification Triggers
 * 
 * This module defines serverless functions for:
 * 1. Daily cron: Send hearing reminders 24h before scheduled sessions.
 * 2. Daily cron: Send appeal deadline warnings.
 * 3. Firestore trigger: Send email when a new invoice is created.
 * 
 * IMPORTANT: Deploy with `firebase deploy --only functions`.
 * Requires: firebase-functions, firebase-admin, nodemailer or SendGrid SDK.
 * 
 * NOTE: This is a template. You must configure SMTP/SendGrid credentials 
 * in Firebase environment config before deploying.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// ── Email Service (Facade) ──────────────────────────────────────────
// Replace with real SendGrid/Nodemailer implementation in production.
async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  functions.logger.info(`[EMAIL] To: ${to} | Subject: ${subject}`);
  functions.logger.info(`[EMAIL] Body preview: ${body.substring(0, 200)}...`);
  // TODO: Integrate with SendGrid or Nodemailer
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(functions.config().sendgrid.key);
  // await sgMail.send({ to, from: 'noreply@mohamy.sa', subject, html: body });
}

// ── Helper: Get tenant admin email ──────────────────────────────────
async function getTenantAdminEmail(tenantId: string): Promise<string | null> {
  const usersSnap = await db.collection("users")
    .where("tenantId", "==", tenantId)
    .where("role", "in", ["admin", "office_admin"])
    .limit(1)
    .get();

  if (usersSnap.empty) return null;
  return usersSnap.docs[0].data().email || null;
}

// ══════════════════════════════════════════════════════════════════════
// 1. HEARING REMINDER — Runs daily at 8:00 AM (KSA = UTC+3, so 5:00 UTC)
// ══════════════════════════════════════════════════════════════════════
export const sendHearingReminders = functions.pubsub
  .schedule("0 5 * * *") // Every day at 05:00 UTC (08:00 KSA)
  .timeZone("Asia/Riyadh")
  .onRun(async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

    functions.logger.info(`[HEARING REMINDER] Checking deadlines for ${tomorrowStr}`);

    // Query all deadlines for tomorrow across all tenants
    const deadlinesSnap = await db.collectionGroup("deadlines")
      .where("type", "==", "hearing")
      .where("date", ">=", `${tomorrowStr}T00:00:00`)
      .where("date", "<=", `${tomorrowStr}T23:59:59`)
      .get();

    functions.logger.info(`[HEARING REMINDER] Found ${deadlinesSnap.size} upcoming hearings`);

    for (const doc of deadlinesSnap.docs) {
      const deadline = doc.data();
      const tenantId = deadline.tenantId;
      if (!tenantId) continue;

      const adminEmail = await getTenantAdminEmail(tenantId);
      if (!adminEmail) continue;

      await sendEmail(
        adminEmail,
        `⚖️ تذكير: جلسة محكمة غداً — ${deadline.title || "بدون عنوان"}`,
        `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px;">
          <h2 style="color: #006c35;">تذكير بجلسة قادمة</h2>
          <p><strong>العنوان:</strong> ${deadline.title || "غير محدد"}</p>
          <p><strong>التاريخ:</strong> ${deadline.date}</p>
          <p><strong>القضية:</strong> ${deadline.caseId || "-"}</p>
          <hr/>
          <p style="color: #666; font-size: 12px;">هذا تنبيه آلي من منصة ليجل ERP — LegalERP</p>
        </div>
        `
      );
    }

    functions.logger.info("[HEARING REMINDER] Completed.");
  });

// ══════════════════════════════════════════════════════════════════════
// 2. APPEAL DEADLINE WARNING — Runs daily at 7:00 AM KSA
// ══════════════════════════════════════════════════════════════════════
export const sendAppealDeadlineWarnings = functions.pubsub
  .schedule("0 4 * * *") // 04:00 UTC = 07:00 KSA
  .timeZone("Asia/Riyadh")
  .onRun(async () => {
    // Appeals typically have a 30-day window. Warn 3 days before expiry.
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 3);
    const warningStr = warningDate.toISOString().split("T")[0];

    functions.logger.info(`[APPEAL DEADLINE] Checking appeals expiring around ${warningStr}`);

    const casesSnap = await db.collection("cases")
      .where("status", "==", "نشطة")
      .get();

    let warningCount = 0;

    for (const doc of casesSnap.docs) {
      const caseData = doc.data();
      const appealDeadline = caseData.appealDeadline;

      if (!appealDeadline) continue;
      const deadlineDate = new Date(appealDeadline);
      const diff = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      // Warn if 3 days or less remaining
      if (diff > 0 && diff <= 3) {
        const adminEmail = await getTenantAdminEmail(caseData.tenantId);
        if (!adminEmail) continue;

        await sendEmail(
          adminEmail,
          `⚠️ تنبيه: مدة الاستئناف تنتهي خلال ${diff} أيام — ${caseData.plaintiff} ضد ${caseData.defendant}`,
          `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px;">
            <h2 style="color: #d4af37;">تحذير: انتهاء مهلة الاستئناف</h2>
            <p><strong>القضية:</strong> ${caseData.plaintiff} ضد ${caseData.defendant}</p>
            <p><strong>الموعد النهائي:</strong> ${appealDeadline}</p>
            <p><strong>المتبقي:</strong> ${diff} أيام فقط</p>
            <hr/>
            <p style="color: #666; font-size: 12px;">منصة ليجل ERP — LegalERP</p>
          </div>
          `
        );
        warningCount++;
      }
    }

    functions.logger.info(`[APPEAL DEADLINE] Sent ${warningCount} warnings.`);
  });

// ══════════════════════════════════════════════════════════════════════
// 3. NEW INVOICE NOTIFICATION — Firestore onCreate trigger
// ══════════════════════════════════════════════════════════════════════
export const onInvoiceCreated = functions.firestore
  .document("invoices/{invoiceId}")
  .onCreate(async (snap) => {
    const invoice = snap.data();
    functions.logger.info(`[INVOICE] New invoice created: ${invoice.id}, total: ${invoice.total}`);

    if (!invoice.tenantId) return;

    const adminEmail = await getTenantAdminEmail(invoice.tenantId);
    if (!adminEmail) return;

    await sendEmail(
      adminEmail,
      `🧾 فاتورة ضريبية جديدة — ${invoice.id} بقيمة ${invoice.total} ر.س`,
      `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px;">
        <h2 style="color: #006c35;">فاتورة ضريبية جديدة</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; font-weight: bold;">رقم الفاتورة:</td><td>${invoice.id}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">العميل:</td><td>${invoice.clientName}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">المبلغ الأساسي:</td><td>${invoice.base} ر.س</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">ضريبة القيمة المضافة (15%):</td><td>${invoice.vat} ر.س</td></tr>
          <tr style="background: #f8f9fa;"><td style="padding: 8px; font-weight: bold;">الإجمالي:</td><td style="font-weight: bold; color: #006c35;">${invoice.total} ر.س</td></tr>
        </table>
        <hr/>
        <p style="color: #666; font-size: 12px;">هذا إشعار آلي من منصة ليجل ERP — LegalERP</p>
      </div>
      `
    );
  });
