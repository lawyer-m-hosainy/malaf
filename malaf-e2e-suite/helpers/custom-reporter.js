// helpers/custom-reporter.js
const fs = require('fs');
const path = require('path');

class MalafAuditReporter {
  constructor() {
    this.issues = [];
    this.passed = [];
    this.warnings = [];
    this.startTime = Date.now();
    this.suites = {};
  }

  onBegin(config, suite) {
    console.log('\n🔍 بدء تدقيق منصة ملف - Malaf.pro Audit\n');
    fs.mkdirSync('reports', { recursive: true });
  }

  onTestBegin(test) {
    console.log(`  ▶ ${test.title}`);
  }

  onTestEnd(test, result) {
    const suiteName = test.parent?.title || 'General';
    if (!this.suites[suiteName]) this.suites[suiteName] = [];

    const entry = {
      title: test.title,
      status: result.status,
      duration: result.duration,
      error: result.error?.message,
      annotations: test.annotations,
    };

    this.suites[suiteName].push(entry);

    if (result.status === 'passed') {
      this.passed.push(entry);
      console.log(`  ✅ ${test.title} (${result.duration}ms)`);
    } else if (result.status === 'failed') {
      this.issues.push(entry);
      console.log(`  ❌ ${test.title} — ${result.error?.message?.split('\n')[0]}`);
    } else if (result.status === 'timedOut') {
      this.warnings.push({ ...entry, status: 'timeout' });
      console.log(`  ⚠️  ${test.title} — انتهت المهلة (Timeout)`);
    }
  }

  onEnd(result) {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    this._buildReport(duration, result);
  }

  _buildReport(duration, result) {
    const total = this.passed.length + this.issues.length + this.warnings.length;
    const passRate = total > 0 ? ((this.passed.length / total) * 100).toFixed(1) : 0;
    const now = new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' });

    const suiteSections = Object.entries(this.suites).map(([name, tests]) => {
      const rows = tests.map(t => {
        const icon = t.status === 'passed' ? '✅' : t.status === 'failed' ? '❌' : '⚠️';
        const err = t.error ? `\n      > ${t.error.split('\n')[0].slice(0, 120)}` : '';
        return `    ${icon} ${t.title} (${t.duration}ms)${err}`;
      }).join('\n');
      return `\n## ${name}\n${rows}`;
    }).join('\n');

    const issueDetails = this.issues.length > 0
      ? this.issues.map((i, idx) =>
          `${idx + 1}. ❌ [${i.title}]\n   الخطأ: ${i.error?.split('\n')[0] || 'Unknown error'}`
        ).join('\n\n')
      : '   لا توجد أخطاء مسجلة ✓';

    const warnDetails = this.warnings.length > 0
      ? this.warnings.map((w, idx) =>
          `${idx + 1}. ⚠️  [${w.title}] — ${w.status === 'timeout' ? 'انتهت مهلة الاختبار' : 'تحذير'}`
        ).join('\n')
      : '   لا توجد تحذيرات ✓';

    const report = `
╔══════════════════════════════════════════════════════════════════╗
║         تقرير تدقيق منصة ملف - Malaf.pro E2E Audit Report        ║
╚══════════════════════════════════════════════════════════════════╝

📅 تاريخ التقرير:  ${now}
⏱  مدة التشغيل:   ${duration} ثانية
🌐 البيئة:         https://malaf.pro

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 ملخص النتائج

   ✅ نجح:           ${this.passed.length}
   ❌ فشل:           ${this.issues.length}
   ⚠️  تحذيرات:      ${this.warnings.length}
   📝 الإجمالي:      ${total}
   📈 نسبة النجاح:   ${passRate}%
   🏁 الحالة:        ${result.status === 'passed' ? '🟢 ناجح' : '🔴 به مشاكل'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${suiteSections}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 الأخطاء المكتشفة

${issueDetails}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  التحذيرات

${warnDetails}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 ملاحظات المدقق

   • تم تشغيل هذه الاختبارات في وضع القراءة فقط (Read-Only Audit)
   • لم يتم تعديل أي كود أو بيانات في المنصة
   • تسجيل الحسابات الوهمية يُستخدم فقط للاختبار ثم يُحذف
   • الاختبارات تغطي: تسجيل الحساب، لوحة التحكم، وكلاء الذكاء الاصطناعي،
     الدردشة، مكالمات الفيديو، التصفح العام
   • لمزيد من التفاصيل راجع: reports/html-report/index.html

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    fs.writeFileSync('reports/AUDIT_REPORT.txt', report);
    console.log('\n' + report);
    console.log('📄 التقرير الكامل محفوظ في: reports/AUDIT_REPORT.txt');
    console.log('🌐 تقرير HTML في: reports/html-report/index.html\n');
  }
}

module.exports = MalafAuditReporter;
