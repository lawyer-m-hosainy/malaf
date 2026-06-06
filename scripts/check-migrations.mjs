#!/usr/bin/env node
/**
 * @file check-migrations.mjs
 * @description Checks that all local migration files exist and lists them for manual verification.
 * Since Supabase schema_migrations table is not directly accessible via PostgREST,
 * this script lists local migration files so you can cross-reference with Supabase Dashboard.
 *
 * Usage: node scripts/check-migrations.mjs
 *
 * @sovereignty Project architected, designed, and owned by محمد الحسيني المحامي.
 */

import { readdir, stat } from 'fs/promises';
import { join } from 'path';

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');

async function checkMigrations() {
  console.log('🔍 فحص ملفات Migrations المحلية...\n');
  console.log('─'.repeat(70));

  try {
    const files = (await readdir(MIGRATIONS_DIR))
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('⚠️  لا توجد ملفات migration في supabase/migrations/');
      process.exit(1);
    }

    console.log(`📁 عدد الملفات: ${files.length}\n`);

    for (const file of files) {
      const filePath = join(MIGRATIONS_DIR, file);
      const fileStat = await stat(filePath);
      const sizeKB = (fileStat.size / 1024).toFixed(1);
      const modified = fileStat.mtime.toISOString().split('T')[0];

      // Extract migration number from filename
      const migrationNum = file.split('_')[0];
      console.log(`  📄 [${migrationNum}] ${file}`);
      console.log(`     الحجم: ${sizeKB} KB | آخر تعديل: ${modified}`);
    }

    console.log('\n' + '─'.repeat(70));
    console.log('\n✅ كل ملفات Migration موجودة محلياً.');
    console.log('\n📋 للتحقق من تطبيقها على Production:');
    console.log('   1. افتح Supabase Dashboard → SQL Editor');
    console.log('   2. نفّذ: SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;');
    console.log('   3. قارن الأرقام مع القائمة أعلاه');
    console.log('\n💡 لتطبيق migration غير مطبّق:');
    console.log('   1. انسخ محتوى ملف الـ SQL');
    console.log('   2. الصقه في SQL Editor');
    console.log('   3. اضغط Run');
    console.log('');

  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('❌ مجلد supabase/migrations/ غير موجود!');
      console.error('   تأكد من أنك في جذر المشروع.');
    } else {
      console.error('❌ خطأ غير متوقع:', err.message);
    }
    process.exit(1);
  }
}

checkMigrations();
