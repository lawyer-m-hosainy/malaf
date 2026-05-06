// ═══════════════════════════════════════════════════════
// منسّق رسائل الواتساب — مَلَف (Malaf)
// ═══════════════════════════════════════════════════════
// قوالب رسائل عربية جاهزة لكل أنواع الإشعارات
// ═══════════════════════════════════════════════════════

const templates = {

  // ── حالة القضية (رد على استفسار الموكل) ──
  caseStatus: ({ caseNumber, court, status, lastSession }) => {
    let msg = `⚖️ القضية رقم ${caseNumber}\n🏛️ ${court || '—'}\n📊 الحالة: ${status || '—'}`;
    if (lastSession) {
      msg += `\n\n📅 آخر جلسة: ${lastSession.date || '—'}`;
      if (lastSession.notes) msg += `\n📋 ${lastSession.notes}`;
    }
    msg += '\n\nللمزيد من التفاصيل تواصل مع المكتب.';
    return msg;
  },

  // ── حالة الفواتير ──
  invoiceStatus: ({ invoices }) => {
    if (!invoices?.length) return '✅ لا توجد فواتير مستحقة حالياً.';
    const total = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    let msg = `📄 فواتيرك المستحقة (${invoices.length}):\n`;
    invoices.forEach((inv, i) => {
      const dueDate = inv.due_date ? new Date(inv.due_date).toLocaleDateString('ar-EG') : '—';
      msg += `\n${i + 1}. ${inv.amount?.toLocaleString('ar-EG')} ج.م — استحقاق: ${dueDate}`;
    });
    msg += `\n\n💰 الإجمالي: ${total.toLocaleString('ar-EG')} ج.م`;
    msg += '\n\nللدفع أو الاستفسار تواصل مع المكتب.';
    return msg;
  },

  // ── تذكير جلسة (24 ساعة) ──
  sessionReminder24h: ({ caseNumber, court, date, time, clientName }) => {
    return `⏰ تذكير بموعد جلسة غداً\n\nالسيد/ ${clientName}\nالقضية رقم ${caseNumber}\n🏛️ ${court}\n📅 ${date}${time ? ` الساعة ${time}` : ''}\n\nيُرجى الحضور في الموعد أو التواصل مع المكتب.`;
  },

  // ── تذكير جلسة (3 ساعات) ──
  sessionReminder3h: ({ caseNumber, court, time }) => {
    return `🔴 تذكير عاجل: جلستك بعد 3 ساعات\n\nالقضية ${caseNumber}\n🏛️ ${court}${time ? `\n⏰ ${time}` : ''}\n\nبالتوفيق.`;
  },

  // ── نتيجة جلسة ──
  sessionResult: ({ caseNumber, result, nextDate }) => {
    let msg = `📋 نتيجة جلسة القضية ${caseNumber}\n\n${result}`;
    if (nextDate) msg += `\n\n📅 الموعد القادم: ${nextDate}`;
    return msg;
  },

  // ── فاتورة مستحقة ──
  invoiceDue: ({ clientName, amount, dueDate }) => {
    return `📄 تنبيه استحقاق فاتورة\n\nالسيد/ ${clientName}\nالمبلغ: ${amount?.toLocaleString('ar-EG')} ج.م\nتاريخ الاستحقاق: ${dueDate}\n\nللدفع أو الاستفسار تواصل مع المكتب.`;
  },

  // ── التقرير الأسبوعي (للمحامي) ──
  weeklyReport: ({ totalCases, sessionsThisWeek, upcomingSessions, overdueInvoices }) => {
    return `📊 التقرير الأسبوعي — مَلَف\n\n⚖️ إجمالي القضايا النشطة: ${totalCases}\n📅 جلسات هذا الأسبوع: ${sessionsThisWeek}\n📅 جلسات الأسبوع القادم: ${upcomingSessions}\n💰 فواتير متأخرة: ${overdueInvoices}\n\nأسبوع موفق!`;
  },
};


// ═══════════════════════════════════════════════════════
// الدالة الرئيسية
// ═══════════════════════════════════════════════════════

export function formatMessage(templateName, data) {
  const template = templates[templateName];
  if (!template) {
    console.error(`Template "${templateName}" not found`);
    return 'عذراً، حدث خطأ في تنسيق الرسالة.';
  }
  try {
    return template(data);
  } catch (err) {
    console.error('Message format error:', err);
    return 'عذراً، حدث خطأ في تنسيق الرسالة.';
  }
}
