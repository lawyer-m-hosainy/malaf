// ═══════════════════════════════════════════════════════
// محلل أوامر الواتساب — مَلَف (Malaf)
// ═══════════════════════════════════════════════════════
// يحلل رسائل المحامي ويحولها لعمليات على Supabase
// الأوامر: جلسة، موعد، مصروف، فاتورة، اليوم، ذكرني، موكل جديد
// ═══════════════════════════════════════════════════════

import { z } from 'zod';

// ── Zod Schemas للتحقق ──

const SessionCommandSchema = z.object({
  caseNumber: z.string().regex(/^\d{1,6}$/, 'رقم القضية غير صحيح'),
  result: z.string().min(3, 'النتيجة قصيرة جداً').max(500),
  nextDate: z.string().optional(),
});

const AppointmentCommandSchema = z.object({
  caseNumber: z.string().regex(/^\d{1,6}$/),
  date: z.string().regex(/^\d{1,2}\/\d{1,2}(\/\d{2,4})?$/, 'صيغة التاريخ غير صحيحة'),
  time: z.string().optional(),
});

const ExpenseCommandSchema = z.object({
  amount: z.number().positive('المبلغ يجب أن يكون موجباً').max(1000000),
  description: z.string().min(2).max(200),
});

const NewClientCommandSchema = z.object({
  name: z.string().min(3, 'اسم الموكل قصير جداً').max(100),
  phone: z.string().regex(/^01[0125]\d{8}$/, 'رقم الهاتف المصري غير صحيح'),
});


// ── مساعد: تحويل تاريخ عربي لـ ISO ──
function parseArabicDate(dateStr) {
  // يقبل: 15/7 أو 15/7/2024 أو 15/7/24
  const parts = dateStr.split('/');
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  let year = parts[2] ? parseInt(parts[2]) : new Date().getFullYear();
  if (year < 100) year += 2000;
  const date = new Date(year, month, day);
  return date.toISOString().split('T')[0];
}


// ═══════════════════════════════════════════════════════
// تحليل الأوامر السبعة
// ═══════════════════════════════════════════════════════

export async function parseCommand(text, orgId, supabase) {
  const trimmed = text.trim();

  // ── 1. جلسة [رقم] [النتيجة] ──
  // مثال: "جلسة 1045 تأجلت لـ 15/7"
  if (trimmed.startsWith('جلسة ')) {
    return await handleSessionCommand(trimmed, orgId, supabase);
  }

  // ── 2. موعد [رقم] [التاريخ] [الوقت] ──
  // مثال: "موعد 1045 15/7 الساعة 11"
  if (trimmed.startsWith('موعد ')) {
    return await handleAppointmentCommand(trimmed, orgId, supabase);
  }

  // ── 3. مصروف [المبلغ] [الوصف] ──
  // مثال: "مصروف 350 رسوم قلم"
  if (trimmed.startsWith('مصروف ')) {
    return await handleExpenseCommand(trimmed, orgId, supabase);
  }

  // ── 4. فاتورة [رقم الهاتف] ──
  // مثال: "فاتورة 01012345678"
  if (trimmed.startsWith('فاتورة ')) {
    return await handleInvoiceCommand(trimmed, orgId, supabase);
  }

  // ── 5. اليوم ──
  if (trimmed === 'اليوم' || trimmed === 'جلسات اليوم') {
    return await handleTodayCommand(orgId, supabase);
  }

  // ── 6. ذكرني [الرسالة] ──
  // مثال: "ذكرني اتصل بأحمد الساعة 3"
  if (trimmed.startsWith('ذكرني ')) {
    return await handleReminderCommand(trimmed, orgId, supabase);
  }

  // ── 7. موكل جديد [الاسم] [الرقم] ──
  // مثال: "موكل جديد محمد علي 01098765432"
  if (trimmed.startsWith('موكل جديد ')) {
    return await handleNewClientCommand(trimmed, orgId, supabase);
  }

  // ── 8. وصلت [ملاحظة اختيارية] ──
  // مثال: "وصلت" أو "وصلت محكمة شمال القاهرة"
  // ملاحظة: يحتاج رسالة موقع (location) مرفقة أو يُرسل بدونها كتأكيد فقط
  if (trimmed === 'وصلت' || trimmed.startsWith('وصلت ')) {
    return await handleCheckinCommand(trimmed, orgId, supabase);
  }

  // لم يُتعرف على الأمر
  return { recognized: false, command: null, response: null };
}


// ═══════════════════════════════════════════════════════
// تنفيذ كل أمر
// ═══════════════════════════════════════════════════════

async function handleSessionCommand(text, orgId, supabase) {
  try {
    // استخراج: جلسة [رقم] [النتيجة]
    const match = text.match(/^جلسة\s+(\d+)\s+(.+)$/);
    if (!match) return { recognized: true, command: 'جلسة', response: '⚠️ الصيغة: جلسة [رقم القضية] [النتيجة]\nمثال: جلسة 1045 تأجلت لـ 15/7' };

    const parsed = SessionCommandSchema.safeParse({ caseNumber: match[1], result: match[2] });
    if (!parsed.success) return { recognized: true, command: 'جلسة', response: '⚠️ ' + parsed.error.issues[0].message };

    // البحث عن القضية
    const { data: caseData } = await supabase
      .from('cases')
      .select('id, case_number, client_id')
      .eq('org_id', orgId)
      .eq('case_number', match[1])
      .is('deleted_at', null)
      .single();

    if (!caseData) return { recognized: true, command: 'جلسة', response: `⚠️ لم أجد قضية برقم ${match[1]}` };

    // استخراج تاريخ من النتيجة إن وُجد
    const dateMatch = match[2].match(/(\d{1,2}\/\d{1,2}(\/\d{2,4})?)/);
    const nextDate = dateMatch ? parseArabicDate(dateMatch[1]) : null;

    // إضافة جلسة جديدة
    await supabase.from('sessions').insert({
      case_id: caseData.id,
      date: nextDate || new Date().toISOString().split('T')[0],
      notes: match[2],
    });

    const response = `✅ تم تسجيل نتيجة الجلسة للقضية ${match[1]}\n📋 ${match[2]}${nextDate ? `\n📅 الموعد القادم: ${nextDate}` : ''}`;
    return { recognized: true, command: 'جلسة', response, caseId: caseData.id };

  } catch (err) {
    console.error('Session command error:', err);
    return { recognized: true, command: 'جلسة', response: '⚠️ حدث خطأ أثناء تسجيل الجلسة' };
  }
}


async function handleAppointmentCommand(text, orgId, supabase) {
  try {
    const match = text.match(/^موعد\s+(\d+)\s+(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*(?:الساعة\s+(\d{1,2}))?/);
    if (!match) return { recognized: true, command: 'موعد', response: '⚠️ الصيغة: موعد [رقم القضية] [التاريخ]\nمثال: موعد 1045 15/7 الساعة 11' };

    const { data: caseData } = await supabase
      .from('cases')
      .select('id')
      .eq('org_id', orgId)
      .eq('case_number', match[1])
      .is('deleted_at', null)
      .single();

    if (!caseData) return { recognized: true, command: 'موعد', response: `⚠️ لم أجد قضية برقم ${match[1]}` };

    const dateStr = parseArabicDate(match[2]);
    const time = match[3] ? `${match[3]}:00` : '09:00';

    await supabase.from('calendar_events').insert({
      org_id: orgId,
      title: `جلسة قضية ${match[1]}`,
      start_date: `${dateStr}T${time}:00`,
      end_date: `${dateStr}T${parseInt(time) + 1}:00:00`,
      type: 'session',
      case_id: caseData.id,
    });

    return { recognized: true, command: 'موعد', response: `✅ تم إضافة موعد جلسة القضية ${match[1]}\n📅 ${dateStr} الساعة ${time}` };
  } catch (err) {
    console.error('Appointment command error:', err);
    return { recognized: true, command: 'موعد', response: '⚠️ حدث خطأ أثناء إضافة الموعد' };
  }
}


async function handleExpenseCommand(text, orgId, supabase) {
  try {
    const match = text.match(/^مصروف\s+(\d+(?:\.\d+)?)\s+(.+)$/);
    if (!match) return { recognized: true, command: 'مصروف', response: '⚠️ الصيغة: مصروف [المبلغ] [الوصف]\nمثال: مصروف 350 رسوم قلم' };

    const amount = parseFloat(match[1]);
    const description = match[2].trim();

    const parsed = ExpenseCommandSchema.safeParse({ amount, description });
    if (!parsed.success) return { recognized: true, command: 'مصروف', response: '⚠️ ' + parsed.error.issues[0].message };

    await supabase.from('expenses').insert({
      org_id: orgId,
      amount,
      description,
      category: 'رسوم قضائية',
      date: new Date().toISOString().split('T')[0],
    });

    return { recognized: true, command: 'مصروف', response: `✅ تم تسجيل مصروف ${amount} ج.م\n📝 ${description}` };
  } catch (err) {
    console.error('Expense command error:', err);
    return { recognized: true, command: 'مصروف', response: '⚠️ حدث خطأ أثناء تسجيل المصروف' };
  }
}


async function handleInvoiceCommand(text, orgId, supabase) {
  try {
    const match = text.match(/^فاتورة\s+(01[0125]\d{8})$/);
    if (!match) return { recognized: true, command: 'فاتورة', response: '⚠️ الصيغة: فاتورة [رقم هاتف الموكل]\nمثال: فاتورة 01012345678' };

    const phone = '+2' + match[1];
    const { data: contact } = await supabase
      .from('whatsapp_contacts')
      .select('linked_id')
      .eq('org_id', orgId)
      .eq('phone_number', phone)
      .eq('contact_type', 'client')
      .single();

    if (!contact?.linked_id) return { recognized: true, command: 'فاتورة', response: '⚠️ لم أجد موكل مسجل بهذا الرقم' };

    const { data: invoices } = await supabase
      .from('invoices')
      .select('amount, status, due_date')
      .eq('org_id', orgId)
      .eq('client_id', contact.linked_id)
      .eq('status', 'unpaid')
      .limit(3);

    if (!invoices?.length) return { recognized: true, command: 'فاتورة', response: '✅ لا توجد فواتير مستحقة لهذا الموكل' };

    const total = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    return { recognized: true, command: 'فاتورة', response: `📄 فواتير مستحقة: ${invoices.length}\n💰 الإجمالي: ${total.toLocaleString('ar-EG')} ج.م\n(سيتم إرسال التفاصيل للموكل على الواتساب)` };
  } catch (err) {
    console.error('Invoice command error:', err);
    return { recognized: true, command: 'فاتورة', response: '⚠️ حدث خطأ أثناء البحث عن الفواتير' };
  }
}


async function handleTodayCommand(orgId, supabase) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: sessions } = await supabase
      .from('sessions')
      .select('date, time, court_room, notes, cases!inner(case_number, court, org_id)')
      .eq('cases.org_id', orgId)
      .eq('date', today)
      .order('time')
      .limit(20);

    if (!sessions?.length) {
      return { recognized: true, command: 'اليوم', response: '📅 لا توجد جلسات مجدولة اليوم ✅' };
    }

    let response = `📅 جلسات اليوم (${sessions.length}):\n`;
    sessions.forEach((s, i) => {
      response += `\n${i + 1}. قضية ${s.cases?.case_number || '—'}\n   🏛️ ${s.cases?.court || '—'}${s.time ? ` ⏰ ${s.time}` : ''}${s.notes ? `\n   📋 ${s.notes}` : ''}`;
    });

    return { recognized: true, command: 'اليوم', response };
  } catch (err) {
    console.error('Today command error:', err);
    return { recognized: true, command: 'اليوم', response: '⚠️ حدث خطأ أثناء جلب جلسات اليوم' };
  }
}


async function handleReminderCommand(text, orgId, supabase) {
  try {
    const match = text.match(/^ذكرني\s+(.+?)(?:\s+الساعة\s+(\d{1,2}))?$/);
    if (!match) return { recognized: true, command: 'ذكرني', response: '⚠️ الصيغة: ذكرني [الرسالة] الساعة [الوقت]\nمثال: ذكرني اتصل بأحمد الساعة 3' };

    const reminderText = match[1].trim();
    const hour = match[2] ? parseInt(match[2]) : null;

    let scheduledAt = new Date();
    if (hour !== null) {
      scheduledAt.setHours(hour, 0, 0, 0);
      if (scheduledAt <= new Date()) scheduledAt.setDate(scheduledAt.getDate() + 1);
    } else {
      scheduledAt.setHours(scheduledAt.getHours() + 1); // بعد ساعة افتراضياً
    }

    await supabase.from('whatsapp_scheduled').insert({
      org_id: orgId,
      target_phone: '', // سيُملأ من السياق
      message_template: `⏰ تذكير: ${reminderText}`,
      scheduled_at: scheduledAt.toISOString(),
      status: 'pending',
      trigger_type: 'custom_reminder',
    });

    const timeStr = scheduledAt.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    return { recognized: true, command: 'ذكرني', response: `✅ تم ضبط التذكير\n⏰ ${timeStr}\n📝 ${reminderText}` };
  } catch (err) {
    console.error('Reminder command error:', err);
    return { recognized: true, command: 'ذكرني', response: '⚠️ حدث خطأ أثناء ضبط التذكير' };
  }
}


async function handleNewClientCommand(text, orgId, supabase) {
  try {
    // موكل جديد محمد علي 01098765432
    const match = text.match(/^موكل جديد\s+(.+?)\s+(01[0125]\d{8})$/);
    if (!match) return { recognized: true, command: 'موكل جديد', response: '⚠️ الصيغة: موكل جديد [الاسم] [رقم الهاتف]\nمثال: موكل جديد محمد علي 01098765432' };

    const name = match[1].trim();
    const phone = '+2' + match[2];

    const parsed = NewClientCommandSchema.safeParse({ name, phone: match[2] });
    if (!parsed.success) return { recognized: true, command: 'موكل جديد', response: '⚠️ ' + parsed.error.issues[0].message };

    // التأكد من عدم وجود موكل بنفس الرقم
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('org_id', orgId)
      .eq('phone', phone)
      .is('deleted_at', null)
      .single();

    if (existing) return { recognized: true, command: 'موكل جديد', response: `⚠️ يوجد موكل مسجل بالفعل بهذا الرقم` };

    // إنشاء الموكل
    const { data: newClient, error } = await supabase
      .from('clients')
      .insert({ org_id: orgId, name, phone, type: 'فرد' })
      .select('id')
      .single();

    if (error) throw error;

    // تسجيله كجهة اتصال واتساب
    await supabase.from('whatsapp_contacts').insert({
      org_id: orgId,
      phone_number: phone,
      contact_type: 'client',
      linked_id: newClient.id,
      display_name: name,
      is_verified: false,
    });

    return { recognized: true, command: 'موكل جديد', response: `✅ تم إنشاء ملف للموكل\n👤 ${name}\n📱 ${phone}\n🔗 تم ربطه بالواتساب تلقائياً` };
  } catch (err) {
    console.error('New client command error:', err);
    return { recognized: true, command: 'موكل جديد', response: '⚠️ حدث خطأ أثناء إنشاء ملف الموكل' };
  }
}


// ═══════════════════════════════════════════════════════
// 8. تسجيل الحضور الميداني — "وصلت"
// ═══════════════════════════════════════════════════════

async function handleCheckinCommand(text, orgId, supabase, locationData) {
  try {
    const notes = text.replace(/^وصلت\s*/, '').trim() || null;

    // إذا أرسل المستخدم موقعه عبر واتساب (location message)
    const lat = locationData?.latitude;
    const lng = locationData?.longitude;

    if (!lat || !lng) {
      // لم يُرسل موقع — سجّل كتأكيد بدون تحقق GPS
      await supabase.from('field_checkins').insert({
        org_id: orgId,
        user_id: 'whatsapp_user',
        user_name: 'عبر الواتساب',
        latitude: 0,
        longitude: 0,
        is_verified: false,
        checkin_type: 'arrival',
        source: 'whatsapp',
        notes: notes || 'تسجيل وصول بدون موقع',
      });

      return {
        recognized: true,
        command: 'وصلت',
        response: `✅ تم تسجيل وصولك${notes ? `\n📋 ${notes}` : ''}\n\n💡 لتسجيل موقعك بدقة، أرسل موقعك الحالي (📎 → الموقع) بعد هذه الرسالة.`
      };
    }

    // البحث عن أقرب موقع معروف
    const { data: locations } = await supabase
      .from('known_locations')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true);

    let matchedLocation = null;
    let minDistance = Infinity;

    if (locations?.length) {
      for (const loc of locations) {
        const dist = haversineDistance(lat, lng, loc.latitude, loc.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          matchedLocation = loc;
        }
      }
    }

    const isVerified = matchedLocation && minDistance <= matchedLocation.radius_meters;

    await supabase.from('field_checkins').insert({
      org_id: orgId,
      user_id: 'whatsapp_user',
      user_name: 'عبر الواتساب',
      latitude: lat,
      longitude: lng,
      matched_location_id: isVerified ? matchedLocation.id : null,
      matched_location_name: matchedLocation?.name || null,
      distance_meters: Math.round(minDistance),
      is_verified: isVerified,
      checkin_type: 'arrival',
      source: 'whatsapp',
      notes,
    });

    if (isVerified) {
      return {
        recognized: true,
        command: 'وصلت',
        response: `✅ تم تسجيل وصولك بنجاح!\n📍 ${matchedLocation.name}\n📏 على بُعد ${Math.round(minDistance)} متر\n🔒 تم التحقق من الموقع${notes ? `\n📋 ${notes}` : ''}`
      };
    } else {
      return {
        recognized: true,
        command: 'وصلت',
        response: `✅ تم تسجيل وصولك\n📍 موقع غير معروف${matchedLocation ? `\n📏 أقرب موقع: ${matchedLocation.name} (${Math.round(minDistance)} متر)` : ''}\n⚠️ لم يتم التحقق — الموقع خارج النطاق المسجل${notes ? `\n📋 ${notes}` : ''}`
      };
    }
  } catch (err) {
    console.error('Checkin command error:', err);
    return { recognized: true, command: 'وصلت', response: '⚠️ حدث خطأ أثناء تسجيل الوصول' };
  }
}


// ── مساعد: حساب المسافة بين نقطتين GPS (Haversine Formula) ──
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // نصف قطر الأرض بالمتر
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
