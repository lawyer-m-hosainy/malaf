"""
مولّد مكتبة المعرفة القانونية - ملف
Legal Wiki Generator for Malaf Platform
يتطلب: pip install anthropic
"""

import anthropic
import json
import time
import os
from datetime import datetime

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """أنت محامٍ مصري خبير وأستاذ قانون متخصص في القانون المصري بكل فروعه.
تكتب مقالات قانونية لمنصة "ملف" — مكتبة المعرفة الداخلية للمحامين المصريين.

قواعدك الثابتة:
١. الدقة القانونية أولاً: لا تختلق مواد أو أحكام. إذا لم تتذكر رقم الطعن بالضبط، اذكر المبدأ فقط.
٢. استند للتشريع المصري الحالي — رقم القانون والمادة دائماً.
٣. الأحكام القضائية: المحكمة + السنة + الرقم فقط إن كنت متأكداً 100%.
٤. المواعيد: بدقة متناهية — المحامي يبني عليها تصرفاته.
٥. النماذج: قابلة للاستخدام الفوري بلا تعديل جوهري.
٦. التحديث: نبه على تعديلات 2023-2025 وخاصة ق١/٢٠٢٤.
٧. الأخطاء الشائعة: ما يخطئ فيه المحامون فعلاً.
٨. الصياغة: فصحى مبسطة — لا تعقيد ولا عامية.
٩. التنسيق: Markdown مع عناوين وجداول.
١٠. الأمانة: اذكر الخلافات الفقهية والقضائية إن وجدت."""

ARTICLE_PROMPT_TEMPLATE = """اكتب مقالاً قانونياً متكاملاً لمنصة ملف.

الموضوع: {topic}
التصنيف: {category}
المستوى: متوسط
الجمهور: محامي ممارس

هيكل المقال:
## ١. التعريف القانوني (النص + رقم المادة + القانون)
## ٢. الأساس التشريعي (جدول: القانون | المادة | النص | آخر تعديل)
## ٣. الإجراءات العملية (قائمة مرقمة)
## ٤. المواعيد والآجال (جدول: الإجراء | المدة | البداية | عقوبة الفوات)
## ٥. أحكام النقض والاستئناف (٢-٣ مبادئ راسخة)
## ٦. الأخطاء الشائعة (٣-٥ أخطاء حقيقية)
## ٧. نموذج/صيغة جاهزة (إن وجدت)
## ٨. ملخص سريع (٥-٧ نقاط bullet)
## ٩. المراجع (قانون + لوائح + مراجع فقهية)

المواصفات: عربية فصحى مبسطة، محدث ٢٠٢٤-٢٠٢٥، ٧٠٠-١٠٠٠ كلمة، Markdown كامل."""

CATEGORIES = {
    "الإجراءات الجنائية": [
        "الحبس الاحتياطي — الأحكام والمدد والطعن فيه",
        "التفتيش والضبط — إجراءات صحيحة وأخرى باطلة",
        "الاستئناف الجنائي — قانون ١/٢٠٢٤ الجديد كاملاً",
        "الادعاء المدني بالتبعية في الدعوى الجنائية",
        "وقف تنفيذ الأحكام الجنائية",
        "أسباب انقضاء الدعوى الجنائية",
        "البطلان الإجرائي وأثره على الحكم",
        "التقادم الجنائي — حساب المدد وحالات الانقطاع",
        "الطعن بالنقض في القضايا الجنائية",
        "معارضة الأحكام الغيابية الجنائية",
    ],
    "قانون الأحوال الشخصية": [
        "الطلاق الرجعي والبائن — الفروق والإجراءات",
        "الخلع — الشروط والإجراءات والأثر",
        "النفقة الزوجية — التقدير والتنفيذ والتعديل",
        "حضانة الأطفال — المعايير وسن الحضانة والتسليم",
        "الميراث الشرعي — حساب الأنصبة والعصب والرد",
    ],
    # Add other categories as needed...
}

def generate_article(topic: str, category: str) -> dict:
    """توليد مقال قانوني واحد"""
    prompt = ARTICLE_PROMPT_TEMPLATE.format(topic=topic, category=category)
    
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return {
        "title": topic,
        "category": category,
        "content": response.content[0].text,
        "word_count": len(response.content[0].text.split()),
        "generated_at": datetime.now().isoformat(),
        "model": "claude-3-5-sonnet-20241022",
        "status": "generated"
    }

def generate_all_articles(output_file="legal_wiki.json"):
    """توليد المكتبة كاملة"""
    all_articles = []
    total = sum(len(topics) for topics in CATEGORIES.values())
    current = 0
    
    for category, topics in CATEGORIES.items():
        print(f"\n📂 التصنيف: {category}")
        for topic in topics:
            current += 1
            print(f"  [{current}/{total}] {topic[:50]}...")
            
            try:
                article = generate_article(topic, category)
                all_articles.append(article)
                print(f"  ✅ تم ({article['word_count']} كلمة)")
                
                # حفظ تدريجي كل ١٠ مقالات
                if current % 10 == 0:
                    with open(output_file, "w", encoding="utf-8") as f:
                        json.dump(all_articles, f, ensure_ascii=False, indent=2)
                    print(f"  💾 تم الحفظ ({current} مقال)")
                
                time.sleep(0.5)  # تجنب rate limiting
                
            except Exception as e:
                print(f"  ❌ خطأ: {e}")
                all_articles.append({
                    "title": topic,
                    "category": category,
                    "status": "error",
                    "error": str(e)
                })
    
    # الحفظ النهائي
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_articles, f, ensure_ascii=False, indent=2)
    
    successful = len([a for a in all_articles if a.get("status") == "generated"])
    print(f"\n🎉 اكتمل التوليد: {successful}/{total} مقال بنجاح")
    print(f"📄 الملف: {output_file}")

if __name__ == "__main__":
    generate_all_articles()
