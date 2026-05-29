import Link from "next/link";

export default function RestaurantOnboardingGuidePage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-orange-50 to-white text-slate-900">
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-3xl border border-orange-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
                SmartServeUK
              </p>

              <h1 className="mt-2 text-4xl font-black">
                Restaurant Onboarding Guide
              </h1>

              <p className="mt-4 max-w-3xl text-lg text-slate-600">
                Operational onboarding guidance for restaurants joining
                SmartServeUK London Food Hub platform.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup/restaurant"
                className="rounded-2xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700"
              >
                Start Restaurant Signup
              </Link>

              <Link
                href="/field-sales-guide"
                className="rounded-2xl bg-sky-600 px-6 py-3 font-bold text-white transition hover:bg-sky-700"
              >
                Sales Guide
              </Link>

              <Link
                href="/rider-onboarding-guide"
                className="rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700"
              >
                Rider Guide
              </Link>

              <Link
                href="/"
                className="rounded-2xl border border-orange-300 px-6 py-3 font-bold text-orange-700 transition hover:bg-orange-100"
              >
                Back To Homepage
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section className="rounded-3xl border border-orange-200 bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-black text-orange-600">
              English Guide
            </h2>

            <div className="mt-6 space-y-5 text-[15px] leading-7 text-slate-700">
              <p>
                Welcome to SmartServeUK. Our platform helps restaurants,
                catering businesses and local food entrepreneurs improve
                visibility and digital customer access.
              </p>

              <p>
                Restaurants may showcase menus, photos, cuisine specialties,
                business details and future online ordering capabilities.
              </p>

              <p>
                Founding restaurant partners may receive promotional benefits
                including free subscription periods.
              </p>

              <p>Required onboarding information may include:</p>

              <ul className="list-disc space-y-2 pl-6">
                <li>Restaurant Name</li>
                <li>Owner Name</li>
                <li>Phone Number</li>
                <li>Restaurant Address</li>
                <li>Cuisine Type</li>
                <li>Food Photos</li>
                <li>Opening Hours</li>
              </ul>

              <p>
                Restaurants are expected to maintain food quality, hygiene,
                customer service and professional operational standards.
              </p>

              <p>
                SmartServeUK aims to support local restaurants through digital
                visibility and food hub promotion.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-green-200 bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-black text-green-600">
              বাংলা গাইড
            </h2>

            <div className="mt-6 space-y-5 text-[15px] leading-8 text-slate-700">
              <p>
                SmartServeUK এ আপনাকে স্বাগতম। আমাদের প্ল্যাটফর্ম রেস্টুরেন্ট,
                ক্যাটারিং ব্যবসা এবং স্থানীয় খাদ্য ব্যবসাগুলোকে ডিজিটালভাবে
                গ্রাহকদের কাছে পৌঁছাতে সহায়তা করে।
              </p>

              <p>
                রেস্টুরেন্টগুলো মেনু, খাবারের ছবি, বিশেষ খাবার ও ব্যবসার তথ্য
                প্রদর্শন করতে পারবে।
              </p>

              <p>
                ফাউন্ডিং রেস্টুরেন্ট পার্টনাররা বিশেষ ফ্রি সুবিধা পেতে পারে।
              </p>

              <p>রেজিস্ট্রেশনের জন্য প্রয়োজন হতে পারে:</p>

              <ul className="list-disc space-y-2 pl-6">
                <li>রেস্টুরেন্টের নাম</li>
                <li>মালিকের নাম</li>
                <li>মোবাইল নম্বর</li>
                <li>ঠিকানা</li>
                <li>খাবারের ধরন</li>
                <li>খাবারের ছবি</li>
                <li>খোলার সময়</li>
              </ul>

              <p>
                রেস্টুরেন্টগুলোকে খাবারের মান, পরিচ্ছন্নতা ও পেশাদার আচরণ বজায়
                রাখতে হবে।
              </p>

              <p>
                SmartServeUK স্থানীয় রেস্টুরেন্টগুলোকে ডিজিটালভাবে পরিচিত করতে
                কাজ করছে।
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-amber-200 bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-black text-amber-600">
              الدليل العربي
            </h2>

            <div className="mt-6 space-y-5 text-right text-[15px] leading-8 text-slate-700">
              <p>
                مرحبًا بكم في SmartServeUK. تساعد منصتنا المطاعم وشركات تقديم
                الطعام وأصحاب الأعمال الغذائية المحلية على زيادة الظهور الرقمي
                والوصول إلى العملاء.
              </p>

              <p>
                يمكن للمطاعم عرض القوائم والصور والأطباق المتخصصة ومعلومات
                العمل وخدمات الطلب المستقبلية.
              </p>

              <p>
                قد يحصل شركاء المطاعم المؤسسون على مزايا ترويجية وفترات اشتراك
                مجانية.
              </p>

              <p>قد تشمل معلومات التسجيل المطلوبة:</p>

              <ul className="list-disc space-y-2 pr-6">
                <li>اسم المطعم</li>
                <li>اسم المالك</li>
                <li>رقم الهاتف</li>
                <li>عنوان المطعم</li>
                <li>نوع المطبخ</li>
                <li>صور الطعام</li>
                <li>ساعات العمل</li>
              </ul>
            </div>
          </section>

          <section className="rounded-3xl border border-sky-200 bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-black text-sky-600">
              اردو گائیڈ
            </h2>

            <div className="mt-6 space-y-5 text-[15px] leading-8 text-slate-700">
              <p>
                SmartServeUK میں خوش آمدید۔ ہمارا پلیٹ فارم ریسٹورنٹس، کیٹرنگ
                بزنسز اور مقامی فوڈ کاروباروں کو ڈیجیٹل طور پر زیادہ گاہکوں تک
                پہنچنے میں مدد دیتا ہے۔
              </p>

              <p>
                ریسٹورنٹس اپنے مینیو، کھانے کی تصاویر، خاص ڈشز اور کاروباری
                معلومات دکھا سکتے ہیں۔
              </p>

              <p>
                ابتدائی ریسٹورنٹ پارٹنرز کو خصوصی پروموشنل فوائد اور مفت
                سبسکرپشن کی مدت مل سکتی ہے۔
              </p>

              <p>رجسٹریشن کے لیے معلومات درکار ہو سکتی ہیں:</p>

              <ul className="list-disc space-y-2 pl-6">
                <li>ریسٹورنٹ کا نام</li>
                <li>مالک کا نام</li>
                <li>موبائل نمبر</li>
                <li>ریسٹورنٹ کا پتہ</li>
                <li>کھانے کی قسم</li>
                <li>کھانے کی تصاویر</li>
                <li>کھلنے کے اوقات</li>
              </ul>
            </div>
          </section>

          <section className="rounded-3xl border border-purple-200 bg-white p-8 shadow-sm lg:col-span-2">
            <h2 className="text-3xl font-black text-purple-600">
              คู่มือภาษาไทย
            </h2>

            <div className="mt-6 space-y-5 text-[15px] leading-8 text-slate-700">
              <p>
                ยินดีต้อนรับสู่ SmartServeUK แพลตฟอร์มของเราช่วยร้านอาหาร
                ธุรกิจจัดเลี้ยง และผู้ประกอบการอาหารท้องถิ่น เพิ่มการมองเห็น
                และเข้าถึงลูกค้าในระบบดิจิทัล
              </p>

              <p>
                ร้านอาหารสามารถแสดงเมนู รูปภาพอาหาร อาหารพิเศษ ข้อมูลธุรกิจ
                และความสามารถในการรับออร์เดอร์ในอนาคต
              </p>

              <p>
                ร้านอาหารที่เข้าร่วมในช่วงเริ่มต้นอาจได้รับสิทธิประโยชน์พิเศษ
                รวมถึงช่วงเวลาสมัครสมาชิกฟรี
              </p>

              <p>ข้อมูลที่อาจต้องใช้ในการสมัคร:</p>

              <ul className="list-disc space-y-2 pl-6">
                <li>ชื่อร้านอาหาร</li>
                <li>ชื่อเจ้าของ</li>
                <li>หมายเลขโทรศัพท์</li>
                <li>ที่อยู่ร้านอาหาร</li>
                <li>ประเภทอาหาร</li>
                <li>รูปภาพอาหาร</li>
                <li>เวลาเปิดทำการ</li>
              </ul>
            </div>
          </section>
        </div>

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-black">
            SmartServeUK London Food Hub Initiative
          </h2>

          <p className="mt-4 max-w-4xl leading-7 text-slate-600">
            SmartServeUK aims to support restaurants, local food hubs and
            community businesses through responsible digital growth, operational
            visibility and future-ready food ecosystem development.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/signup/restaurant"
              className="rounded-2xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700"
            >
              Start Restaurant Signup
            </Link>

            <Link
              href="/"
              className="rounded-2xl border border-orange-300 px-6 py-3 font-bold text-orange-700 transition hover:bg-orange-100"
            >
              Back To Homepage
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}