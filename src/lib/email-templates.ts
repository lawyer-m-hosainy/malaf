/**
 * @file email-templates.ts
 * @description Arabic RTL email HTML templates for Malaf Legal Platform.
 * Used server-side only (via services/email-service.js).
 * @sovereignty Project architected, designed, and owned by محمد الحسيني المحامي.
 */

const emailStyles = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    
    body { 
      font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; 
      direction: rtl; 
      text-align: right;
      background: #f4f4f5;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.07);
    }
    .header {
      background: linear-gradient(135deg, #1a3a5c 0%, #2d5a8e 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: white;
      letter-spacing: -0.5px;
    }
    .logo span { color: #f0c040; }
    .content { padding: 40px; }
    .greeting { font-size: 20px; font-weight: 600; color: #1a1a2e; margin-bottom: 16px; }
    .body-text { font-size: 15px; color: #4a4a6a; line-height: 1.8; margin-bottom: 24px; }
    .cta-button {
      display: inline-block;
      background: #1a3a5c;
      color: white !important;
      text-decoration: none;
      padding: 14px 36px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      margin: 16px 0;
    }
    .warning-box {
      background: #fef9ee;
      border: 1px solid #f0c040;
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
      font-size: 13px;
      color: #7a6020;
    }
    .footer {
      background: #f8f8fc;
      padding: 24px 40px;
      text-align: center;
      font-size: 12px;
      color: #9090a0;
      border-top: 1px solid #e8e8f0;
    }
    .divider { height: 1px; background: #e8e8f0; margin: 24px 0; }
  </style>
`;

export interface EmailConfirmationData {
  userName: string;
  confirmationUrl: string;
  officeName?: string;
}

export interface PasswordResetData {
  userName: string;
  resetUrl: string;
  ipAddress?: string;
}

export function buildConfirmationEmail(data: EmailConfirmationData): string {
  const currentYear = new Date().getFullYear();
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد بريدك الإلكتروني — مَلَف</title>
  ${emailStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">\u2696\uFE0F مَلَف<span>.</span>pro</div>
      <p style="color: rgba(255,255,255,0.8); margin-top: 8px; font-size: 14px;">
        المنصة القانونية المتكاملة للمحامين المصريين
      </p>
    </div>
    <div class="content">
      <div class="greeting">أهلاً ${data.userName}،</div>
      <p class="body-text">
        شكراً لتسجيلك في منصة <strong>مَلَف</strong>${data.officeName ? ` — ${data.officeName}` : ''}.
        للبدء في استخدام المنصة وإدارة قضاياك وموكليك، 
        يُرجى تأكيد بريدك الإلكتروني بالنقر على الزر أدناه.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.confirmationUrl}" class="cta-button">
          \u2705 تأكيد البريد الإلكتروني
        </a>
      </div>
      
      <div class="warning-box">
        <strong>\u26A0\uFE0F تنبيه أمني:</strong> هذا الرابط صالح لمدة 24 ساعة فقط. 
        إذا لم تقم بالتسجيل في مَلَف، يُرجى تجاهل هذا البريد.
      </div>
      
      <div class="divider"></div>
      <p class="body-text" style="font-size: 13px; color: #9090a0;">
        إذا لم يعمل الزر، انسخ الرابط التالي في متصفحك:<br>
        <a href="${data.confirmationUrl}" style="color: #1a3a5c; word-break: break-all;">
          ${data.confirmationUrl}
        </a>
      </p>
    </div>
    <div class="footer">
      <p>منصة مَلَف — حقوق النشر \u00A9 ${currentYear} | جميع الحقوق محفوظة</p>
      <p style="margin-top: 8px;">
        هذا البريد مُرسَل تلقائياً، الرجاء عدم الرد عليه.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function buildPasswordResetEmail(data: PasswordResetData): string {
  const currentYear = new Date().getFullYear();
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إعادة تعيين كلمة المرور — مَلَف</title>
  ${emailStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">\u2696\uFE0F مَلَف<span>.</span>pro</div>
      <p style="color: rgba(255,255,255,0.8); margin-top: 8px; font-size: 14px;">
        المنصة القانونية المتكاملة للمحامين المصريين
      </p>
    </div>
    <div class="content">
      <div class="greeting">مرحباً ${data.userName}،</div>
      <p class="body-text">
        تلقّينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في منصة <strong>مَلَف</strong>.
        انقر على الزر أدناه لإنشاء كلمة مرور جديدة.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.resetUrl}" class="cta-button" style="background: #c0392b;">
          \uD83D\uDD11 إعادة تعيين كلمة المرور
        </a>
      </div>
      
      <div class="warning-box" style="background: #fff5f5; border-color: #e74c3c;">
        <strong>\uD83D\uDD12 تحذير أمني مهم:</strong><br>
        \u2022 هذا الرابط صالح لمدة <strong>ساعة واحدة فقط</strong><br>
        \u2022 إذا لم تطلب إعادة التعيين، فبياناتك بأمان — تجاهل هذا البريد فقط<br>
        \u2022 لا تشارك هذا الرابط مع أي شخص<br>
        ${data.ipAddress ? `\u2022 الطلب جاء من عنوان IP: ${data.ipAddress}` : ''}
      </div>
      
      <div class="divider"></div>
      <p class="body-text" style="font-size: 13px; color: #9090a0;">
        إذا لم يعمل الزر، انسخ الرابط التالي في متصفحك:<br>
        <a href="${data.resetUrl}" style="color: #c0392b; word-break: break-all;">
          ${data.resetUrl}
        </a>
      </p>
    </div>
    <div class="footer">
      <p>منصة مَلَف — حقوق النشر \u00A9 ${currentYear} | جميع الحقوق محفوظة</p>
      <p style="margin-top: 8px;">
        هذا البريد مُرسَل تلقائياً، الرجاء عدم الرد عليه.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
