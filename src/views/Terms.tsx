import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, Scale, FileText, AlertTriangle, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
  const navigate = useNavigate();
  const lastUpdated = "15 مايو 2026";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 text-navy-900 dark:text-white font-sans" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 py-16">
        <div className="container mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Scale className="w-12 h-12 text-white/80 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3">شروط الاستخدام</h1>
            <p className="text-primary-100 text-sm">آخر تحديث: {lastUpdated}</p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-navy-800 rounded-3xl shadow-xl border border-slate-100 dark:border-white/5 p-8 md:p-12 space-y-10 leading-relaxed text-slate-700 dark:text-slate-300"
        >
          {/* مقدمة */}
          <section>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary-500" /> أولاً: التعريفات والأحكام العامة
            </h2>
            <div className="space-y-3 text-sm">
              <p>تُنظّم هذه الشروط والأحكام ("الاتفاقية") العلاقة التعاقدية بين:</p>
              <ul className="list-disc list-inside space-y-1 pr-4">
                <li><strong>"المنصة"</strong> أو <strong>"مَلَف"</strong>: منصة مَلَف لإدارة المكاتب القانونية، المملوكة والمُشغّلة بواسطة شركة ملف لتقنية المعلومات، المسجلة بجمهورية مصر العربية.</li>
                <li><strong>"المشترك"</strong> أو <strong>"المستخدم"</strong>: أي شخص طبيعي أو اعتباري يقوم بالتسجيل في المنصة واستخدام خدماتها.</li>
                <li><strong>"المكتب"</strong>: الكيان القانوني (مكتب محاماة أو شركة قانونية) الذي يتم إنشاؤه داخل المنصة.</li>
                <li><strong>"الخدمات"</strong>: جميع الوظائف والميزات المتاحة عبر المنصة بما في ذلك إدارة القضايا والموكلين والفواتير والعقود والذكاء الاصطناعي.</li>
              </ul>
              <p>باستخدامك للمنصة أو بإنشاء حساب فيها، فإنك تُقر بأنك قرأت هذه الشروط وفهمتها ووافقت عليها، وأنك تمتلك الأهلية القانونية الكاملة لإبرام هذه الاتفاقية وفقاً لأحكام القانون المدني المصري (القانون رقم 131 لسنة 1948).</p>
            </div>
          </section>

          {/* طبيعة الخدمة */}
          <section>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-primary-500" /> ثانياً: طبيعة الخدمة وحدودها
            </h2>
            <div className="space-y-3 text-sm">
              <p><strong>2.1</strong> منصة مَلَف هي أداة تقنية لإدارة الأعمال الإدارية والتنظيمية لمكاتب المحاماة. <strong>المنصة ليست مكتب محاماة ولا تقدم استشارات قانونية</strong> ولا تُعد بديلاً عن المشورة القانونية المتخصصة.</p>
              <p><strong>2.2</strong> ميزة الذكاء الاصطناعي المدمجة في المنصة تُستخدم كأداة مساعدة فقط. المخرجات المُولّدة بواسطة الذكاء الاصطناعي لا تُعد استشارة قانونية ملزمة، ويتحمل المستخدم مسؤولية مراجعتها والتحقق من صحتها قبل استخدامها.</p>
              <p><strong>2.3</strong> جميع القوالب القانونية المتاحة في المنصة هي نماذج استرشادية مبنية على القانون المصري، ويجب على المحامي مراجعتها وتكييفها وفقاً لظروف كل قضية على حدة.</p>
              <p><strong>2.4</strong> المنصة لا تضمن صحة أو دقة البيانات المُدخلة من المستخدم، ولا تتحمل أي مسؤولية عن القرارات المتخذة بناءً على تلك البيانات.</p>
            </div>
          </section>

          {/* الحساب والتسجيل */}
          <section>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary-500" /> ثالثاً: الحساب والتسجيل
            </h2>
            <div className="space-y-3 text-sm">
              <p><strong>3.1</strong> يلتزم المشترك بتقديم بيانات صحيحة ودقيقة عند التسجيل، ويتحمل المسؤولية الكاملة عن أي بيانات غير صحيحة أو مضللة.</p>
              <p><strong>3.2</strong> يلتزم المشترك بالحفاظ على سرية بيانات الدخول الخاصة به (البريد الإلكتروني وكلمة المرور)، ويتحمل المسؤولية الكاملة عن أي نشاط يتم عبر حسابه.</p>
              <p><strong>3.3</strong> يجب ألا يقل عمر المشترك عن 18 سنة ميلادية، وأن يكون متمتعاً بالأهلية القانونية الكاملة.</p>
              <p><strong>3.4</strong> في حالة التسجيل نيابةً عن كيان قانوني (مكتب أو شركة)، يُقر المُسجِّل بأنه مفوّض قانونياً بالتصرف نيابة عن ذلك الكيان.</p>
              <p><strong>3.5</strong> يحق للمنصة تعليق أو إلغاء أي حساب يُشتبه في مخالفته لهذه الشروط، مع إخطار المشترك مسبقاً بمدة لا تقل عن 7 أيام عمل.</p>
            </div>
          </section>

          {/* الاشتراكات والدفع */}
          <section>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary-500" /> رابعاً: الاشتراكات والمقابل المالي
            </h2>
            <div className="space-y-3 text-sm">
              <p><strong>4.1</strong> تُقدَّم خدمات المنصة من خلال باقات اشتراك شهرية أو سنوية، تبدأ بفترة تجربة مجانية مدتها 14 يوماً.</p>
              <p><strong>4.2</strong> جميع الأسعار المعلنة بالجنيه المصري وتشمل ضريبة القيمة المضافة (14%) وفقاً لقانون الضريبة على القيمة المضافة رقم 67 لسنة 2016.</p>
              <p><strong>4.3</strong> يتم تجديد الاشتراك تلقائياً في نهاية كل دورة فوترة ما لم يقم المشترك بإلغاء الاشتراك قبل انتهاء الدورة بـ 3 أيام عمل على الأقل.</p>
              <p><strong>4.4</strong> لا يحق للمشترك استرداد أي مبالغ مدفوعة عن فترات اشتراك سارية أو منتهية، وذلك وفقاً لطبيعة الخدمة الرقمية المُقدَّمة.</p>
              <p><strong>4.5</strong> يحق للمنصة تعديل أسعار الباقات بشرط إخطار المشتركين قبل 30 يوماً من تاريخ سريان التعديل، على أن يسري السعر الجديد من بداية دورة الفوترة التالية.</p>
              <p><strong>4.6</strong> في حالة عدم سداد المقابل المالي في موعده، يحق للمنصة تعليق الخدمة بعد مرور 7 أيام من تاريخ الاستحقاق، مع الاحتفاظ ببيانات المشترك لمدة 90 يوماً.</p>
            </div>
          </section>

          {/* الملكية الفكرية */}
          <section>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-primary-500" /> خامساً: الملكية الفكرية
            </h2>
            <div className="space-y-3 text-sm">
              <p><strong>5.1</strong> جميع حقوق الملكية الفكرية للمنصة — بما في ذلك الكود المصدري، التصميمات، العلامات التجارية، الشعارات، والمحتوى — مملوكة حصرياً لشركة ملف لتقنية المعلومات ومحمية بموجب قانون حماية حقوق الملكية الفكرية رقم 82 لسنة 2002.</p>
              <p><strong>5.2</strong> يمنح الاشتراك المستخدم ترخيصاً محدوداً وغير حصري وغير قابل للتحويل لاستخدام المنصة وفقاً لهذه الشروط، دون أي حق في النسخ أو التعديل أو الهندسة العكسية.</p>
              <p><strong>5.3</strong> البيانات المُدخلة بواسطة المشترك تظل ملكاً له. تلتزم المنصة بعدم استخدام بيانات المشترك لأي غرض خارج نطاق تقديم الخدمة.</p>
            </div>
          </section>

          {/* حماية البيانات */}
          <section>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-primary-500" /> سادساً: حماية البيانات والسرية
            </h2>
            <div className="space-y-3 text-sm">
              <p><strong>6.1</strong> تلتزم المنصة بحماية بيانات المشتركين وفقاً لأفضل المعايير التقنية، بما في ذلك تشفير البيانات بمعيار AES-256-GCM وبروتوكول HTTPS.</p>
              <p><strong>6.2</strong> تلتزم المنصة بالفصل التام بين بيانات المكاتب المختلفة (Multi-Tenant Isolation)، بحيث لا يمكن لأي مكتب الوصول لبيانات مكتب آخر.</p>
              <p><strong>6.3</strong> لا يحق للمنصة الإفصاح عن بيانات المشترك لأي طرف ثالث إلا في الحالات التالية:</p>
              <ul className="list-disc list-inside space-y-1 pr-4">
                <li>بناءً على أمر قضائي صادر من محكمة مصرية مختصة.</li>
                <li>بموافقة خطية صريحة من المشترك.</li>
                <li>لتنفيذ التزام قانوني مفروض على المنصة.</li>
              </ul>
              <p><strong>6.4</strong> يُقر المشترك بعلمه بأن البيانات مُستضافة على خوادم سحابية مؤمنة (Supabase)، وأن المنصة تتخذ جميع الإجراءات التقنية اللازمة لحمايتها.</p>
              <p><strong>6.5</strong> للمزيد من التفاصيل حول معالجة البيانات الشخصية، يُرجى مراجعة <button onClick={() => navigate('/privacy')} className="text-primary-600 font-bold hover:underline">سياسة الخصوصية</button>.</p>
            </div>
          </section>

          {/* التزامات المشترك */}
          <section>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-primary-500" /> سابعاً: التزامات المشترك
            </h2>
            <div className="space-y-3 text-sm">
              <p>يلتزم المشترك بما يلي:</p>
              <ul className="list-disc list-inside space-y-2 pr-4">
                <li>عدم استخدام المنصة في أي نشاط مخالف للقانون المصري أو النظام العام أو الآداب العامة.</li>
                <li>عدم محاولة الوصول غير المشروع لأنظمة المنصة أو بيانات مشتركين آخرين.</li>
                <li>عدم استخدام المنصة لتخزين أو نقل برمجيات خبيثة أو فيروسات.</li>
                <li>عدم إعادة بيع أو تأجير حسابه أو منح وصول لأطراف غير مصرح لها.</li>
                <li>الالتزام بآداب المهنة القانونية عند استخدام المنصة وفقاً لقانون المحاماة رقم 17 لسنة 1983.</li>
                <li>الاحتفاظ بنسخ احتياطية من بياناته الهامة خارج المنصة.</li>
              </ul>
            </div>
          </section>

          {/* تحديد المسؤولية */}
          <section>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-primary-500" /> ثامناً: تحديد المسؤولية
            </h2>
            <div className="space-y-3 text-sm">
              <p><strong>8.1</strong> تُقدَّم المنصة "كما هي" (As Is)، ولا تضمن المنصة خلوها من الأخطاء التقنية أو انقطاع الخدمة، مع التزامها ببذل أقصى جهد لضمان استمرارية الخدمة بنسبة لا تقل عن 99.5%.</p>
              <p><strong>8.2</strong> لا تتحمل المنصة أي مسؤولية عن:</p>
              <ul className="list-disc list-inside space-y-1 pr-4">
                <li>أي خسائر مباشرة أو غير مباشرة ناتجة عن استخدام المنصة أو عدم القدرة على استخدامها.</li>
                <li>أي قرارات قانونية أو مهنية اتخذها المشترك بناءً على مخرجات المنصة أو الذكاء الاصطناعي.</li>
                <li>فقدان البيانات الناتج عن إهمال المشترك أو ظروف قاهرة خارجة عن إرادة المنصة.</li>
                <li>انقطاع الخدمة بسبب أعمال الصيانة المجدولة (بعد إخطار مسبق بـ 24 ساعة).</li>
              </ul>
              <p><strong>8.3</strong> في جميع الأحوال، لا يتجاوز الحد الأقصى لمسؤولية المنصة مبلغ الاشتراك المدفوع عن آخر 3 أشهر سابقة على تاريخ المطالبة.</p>
            </div>
          </section>

          {/* الإنهاء */}
          <section>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary-500" /> تاسعاً: إنهاء الاشتراك
            </h2>
            <div className="space-y-3 text-sm">
              <p><strong>9.1</strong> يحق للمشترك إلغاء اشتراكه في أي وقت من خلال إعدادات الحساب. يسري الإلغاء بنهاية دورة الفوترة الحالية.</p>
              <p><strong>9.2</strong> عند إنهاء الاشتراك، يحق للمشترك تصدير بياناته خلال 30 يوماً من تاريخ الإنهاء. بعد انقضاء هذه المدة، يحق للمنصة حذف البيانات نهائياً.</p>
              <p><strong>9.3</strong> يحق للمنصة إنهاء اشتراك المستخدم فوراً في حالة مخالفته الجسيمة لهذه الشروط، مع إخطاره كتابياً بأسباب الإنهاء.</p>
            </div>
          </section>

          {/* القانون الواجب التطبيق */}
          <section>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-primary-500" /> عاشراً: القانون الواجب التطبيق والاختصاص القضائي
            </h2>
            <div className="space-y-3 text-sm">
              <p><strong>10.1</strong> تخضع هذه الاتفاقية لأحكام القانون المصري وتُفسَّر وفقاً له.</p>
              <p><strong>10.2</strong> في حالة نشوء أي نزاع يتعلق بتفسير أو تنفيذ هذه الاتفاقية، يُحال إلى محاكم المنصورة الابتدائية بمحافظة الدقهلية، جمهورية مصر العربية.</p>
              <p><strong>10.3</strong> يلتزم الطرفان بمحاولة تسوية أي نزاع ودياً خلال 30 يوماً قبل اللجوء للقضاء.</p>
            </div>
          </section>

          {/* أحكام ختامية */}
          <section>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary-500" /> حادي عشر: أحكام ختامية
            </h2>
            <div className="space-y-3 text-sm">
              <p><strong>11.1</strong> يحق للمنصة تعديل هذه الشروط في أي وقت، على أن يتم إخطار المشتركين بالتعديلات عبر البريد الإلكتروني قبل 15 يوماً من تاريخ سريانها.</p>
              <p><strong>11.2</strong> استمرار المشترك في استخدام المنصة بعد سريان التعديلات يُعد قبولاً ضمنياً بها.</p>
              <p><strong>11.3</strong> إذا حُكم ببطلان أي بند من بنود هذه الاتفاقية، فإن ذلك لا يؤثر على صحة باقي البنود.</p>
              <p><strong>11.4</strong> تُشكّل هذه الاتفاقية — مع سياسة الخصوصية — كامل الاتفاق بين الطرفين وتحل محل أي اتفاقات سابقة.</p>
              <p><strong>11.5</strong> للتواصل بشأن هذه الشروط: <span className="font-bold text-navy-900 dark:text-white" dir="ltr">+20 114 197 3834</span></p>
            </div>
          </section>

          <div className="pt-6 border-t border-slate-200 dark:border-white/10 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} شركة ملف لتقنية المعلومات. جميع الحقوق محفوظة.
          </div>
        </motion.div>

        <div className="text-center mt-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2 text-slate-500">
            <ArrowRight size={16} /> العودة للرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}
