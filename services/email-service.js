/**
 * @file email-service.js
 * @description Server-side email sending service using Resend.
 * WARNING: This file runs on the server (Node.js) only — never import from React/browser code.
 * @sovereignty Project architected, designed, and owned by محمد الحسيني المحامي.
 */

import { Resend } from 'resend';

let resendClient = null;

function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

const FROM_EMAIL = 'نظام مَلَف <noreply@malaf.pro>';

/**
 * Build confirmation email HTML (server-side import of templates).
 * We inline the template logic here to avoid ESM/TS import issues in plain JS.
 */
function buildConfirmationHtml({ userName, confirmationUrl, officeName }) {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد بريدك الإلكتروني — مَلَف</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    body { font-family: 'Cairo', sans-serif; direction: rtl; text-align: right; background: #f4f4f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07); }
    .header { background: linear-gradient(135deg, #1a3a5c 0%, #2d5a8e 100%); padding: 32px 40px; text-align: center; }
    .logo { font-size: 28px; font-weight: 700; color: white; }
    .logo span { color: #f0c040; }
    .content { padding: 40px; }
    .greeting { font-size: 20px; font-weight: 600; color: #1a1a2e; margin-bottom: 16px; }
    .body-text { font-size: 15px; color: #4a4a6a; line-height: 1.8; margin-bottom: 24px; }
    .cta-button { display: inline-block; background: #1a3a5c; color: white !important; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 600; }
    .warning-box { background: #fef9ee; border: 1px solid #f0c040; border-radius: 8px; padding: 16px; margin: 24px 0; font-size: 13px; color: #7a6020; }
    .footer { background: #f8f8fc; padding: 24px 40px; text-align: center; font-size: 12px; color: #9090a0; border-top: 1px solid #e8e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚖️ مَلَف<span>.</span>pro</div>
      <p style="color: rgba(255,255,255,0.8); margin-top: 8px; font-size: 14px;">المنصة القانونية المتكاملة للمحامين المصريين</p>
    </div>
    <div class="content">
      <div class="greeting">أهلاً ${userName}،</div>
      <p class="body-text">
        شكراً لتسجيلك في منصة <strong>مَلَف</strong>${officeName ? ` — ${officeName}` : ''}.
        يُرجى تأكيد بريدك الإلكتروني بالنقر على الزر أدناه.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${confirmationUrl}" class="cta-button">✅ تأكيد البريد الإلكتروني</a>
      </div>
      <div class="warning-box">
        <strong>⚠️ تنبيه أمني:</strong> هذا الرابط صالح لمدة 24 ساعة فقط.
        إذا لم تقم بالتسجيل في مَلَف، يُرجى تجاهل هذا البريد.
      </div>
    </div>
    <div class="footer">
      <p>منصة مَلَف — حقوق النشر © ${new Date().getFullYear()} | جميع الحقوق محفوظة</p>
      <p style="margin-top: 8px;">هذا البريد مُرسَل تلقائياً، الرجاء عدم الرد عليه.</p>
    </div>
  </div>
</body>
</html>`.trim();
}

function buildPasswordResetHtml({ userName, resetUrl, ipAddress }) {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إعادة تعيين كلمة المرور — مَلَف</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    body { font-family: 'Cairo', sans-serif; direction: rtl; text-align: right; background: #f4f4f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07); }
    .header { background: linear-gradient(135deg, #1a3a5c 0%, #2d5a8e 100%); padding: 32px 40px; text-align: center; }
    .logo { font-size: 28px; font-weight: 700; color: white; }
    .logo span { color: #f0c040; }
    .content { padding: 40px; }
    .greeting { font-size: 20px; font-weight: 600; color: #1a1a2e; margin-bottom: 16px; }
    .body-text { font-size: 15px; color: #4a4a6a; line-height: 1.8; margin-bottom: 24px; }
    .cta-button { display: inline-block; background: #c0392b; color: white !important; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 600; }
    .warning-box { background: #fff5f5; border: 1px solid #e74c3c; border-radius: 8px; padding: 16px; margin: 24px 0; font-size: 13px; color: #7a2020; }
    .footer { background: #f8f8fc; padding: 24px 40px; text-align: center; font-size: 12px; color: #9090a0; border-top: 1px solid #e8e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚖️ مَلَف<span>.</span>pro</div>
      <p style="color: rgba(255,255,255,0.8); margin-top: 8px; font-size: 14px;">المنصة القانونية المتكاملة للمحامين المصريين</p>
    </div>
    <div class="content">
      <div class="greeting">مرحباً ${userName}،</div>
      <p class="body-text">
        تلقّينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في منصة <strong>مَلَف</strong>.
        انقر على الزر أدناه لإنشاء كلمة مرور جديدة.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" class="cta-button">🔑 إعادة تعيين كلمة المرور</a>
      </div>
      <div class="warning-box">
        <strong>🔒 تحذير أمني مهم:</strong><br>
        • هذا الرابط صالح لمدة <strong>ساعة واحدة فقط</strong><br>
        • إذا لم تطلب إعادة التعيين، تجاهل هذا البريد<br>
        • لا تشارك هذا الرابط مع أي شخص<br>
        ${ipAddress ? `• الطلب جاء من عنوان IP: ${ipAddress}` : ''}
      </div>
    </div>
    <div class="footer">
      <p>منصة مَلَف — حقوق النشر © ${new Date().getFullYear()} | جميع الحقوق محفوظة</p>
      <p style="margin-top: 8px;">هذا البريد مُرسَل تلقائياً، الرجاء عدم الرد عليه.</p>
    </div>
  </div>
</body>
</html>`.trim();
}

function buildSessionReminderHtml({ lawyerName, sessionDate, sessionTime, courtName, caseNumber, caseName, caseUrl }) {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تذكير بجلسة قادمة — مَلَف</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    body { font-family: 'Cairo', sans-serif; direction: rtl; text-align: right; background: #f4f4f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07); }
    .header { background: linear-gradient(135deg, #1a3a5c 0%, #2d5a8e 100%); padding: 32px 40px; text-align: center; }
    .logo { font-size: 28px; font-weight: 700; color: white; }
    .logo span { color: #f0c040; }
    .content { padding: 40px; }
    .greeting { font-size: 20px; font-weight: 600; color: #1a1a2e; margin-bottom: 16px; }
    .body-text { font-size: 15px; color: #4a4a6a; line-height: 1.8; margin-bottom: 24px; }
    .cta-button { display: inline-block; background: #1a3a5c; color: white !important; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 600; }
    .warning-box { background: #fef9ee; border: 1px solid #f0c040; border-radius: 8px; padding: 16px; margin: 24px 0; font-size: 13px; color: #7a6020; }
    .footer { background: #f8f8fc; padding: 24px 40px; text-align: center; font-size: 12px; color: #9090a0; border-top: 1px solid #e8e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚖️ مَلَف<span>.</span>pro</div>
      <p style="color: rgba(255,255,255,0.8); margin-top: 8px; font-size: 14px;">المنصة القانونية المتكاملة للمحامين المصريين</p>
    </div>
    <div class="content">
      <div class="greeting">أهلاً أ. ${lawyerName}،</div>
      <p class="body-text">
        هذا تذكير بأن لديك جلسة قضائية قادمة <strong>غداً</strong>. يرجى مراجعة التفاصيل أدناه لضمان جاهزيتك.
      </p>
      
      <div style="background: #f8f8fc; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #e8e8f0;">
        <h3 style="margin-top: 0; color: #1a3a5c; font-size: 16px;">📌 تفاصيل الجلسة:</h3>
        <ul style="list-style: none; padding: 0; margin: 0; color: #4a4a6a; font-size: 15px; line-height: 2;">
          <li><strong>المحكمة:</strong> ${courtName}</li>
          <li><strong>التاريخ:</strong> ${sessionDate}</li>
          <li><strong>الوقت:</strong> ${sessionTime}</li>
          <li><strong>القضية:</strong> ${caseName}</li>
          <li><strong>رقم القضية:</strong> ${caseNumber}</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${caseUrl}" class="cta-button">📂 عرض تفاصيل القضية</a>
      </div>
      
      <div class="warning-box">
        <strong>⚠️ تحذير السرية:</strong> هذا البريد يحتوي على بيانات قانونية خاصة. 
        لا تقم بمشاركة هذا البريد مع أي أطراف غير مصرح لها.
      </div>
    </div>
    <div class="footer">
      <p>منصة مَلَف — حقوق النشر © ${new Date().getFullYear()} | جميع الحقوق محفوظة</p>
      <p style="margin-top: 8px;">هذا البريد مُرسَل تلقائياً، الرجاء عدم الرد عليه.</p>
    </div>
  </div>
</body>
</html>`.trim();
}

/**
 * Send email confirmation to a new user.
 */
export async function sendConfirmationEmail(toEmail, { userName, confirmationUrl, officeName }) {
  try {
    const client = getResendClient();
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: '✅ تأكيد بريدك الإلكتروني — منصة مَلَف',
      html: buildConfirmationHtml({ userName, confirmationUrl, officeName }),
    });

    if (error) {
      console.error('[Email] Confirmation send error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('[Email] Unexpected error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send password reset email.
 */
export async function sendPasswordResetEmail(toEmail, { userName, resetUrl, ipAddress }) {
  try {
    const client = getResendClient();
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: '🔑 إعادة تعيين كلمة المرور — منصة مَلَف',
      html: buildPasswordResetHtml({ userName, resetUrl, ipAddress }),
    });

    if (error) {
      console.error('[Email] Reset send error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('[Email] Unexpected error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send session reminder email.
 */
export async function sendSessionReminderEmail(toEmail, data) {
  try {
    const client = getResendClient();
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: '📅 تذكير بجلسة قضائية غداً — منصة مَلَف',
      html: buildSessionReminderHtml(data),
    });

    if (error) {
      console.error('[Email] Session reminder send error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('[Email] Unexpected error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}
