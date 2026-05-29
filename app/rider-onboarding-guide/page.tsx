import Link from "next/link";

export default function RiderOnboardingGuidePage() {
  return (
    <main className="min-h-screen bg-emerald-50 text-slate-900">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
                SmartServeUK
              </p>

              <h1 className="mt-2 text-4xl font-black">
                Rider Onboarding Guide
              </h1>

              <p className="mt-4 max-w-3xl text-lg text-slate-600">
                Operational guidance for riders joining the SmartServeUK
                delivery and food hub support network.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup/rider"
                className="rounded-2xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700"
              >
                Apply As Rider
              </Link>

              <Link
                href="/restaurant-onboarding-guide"
                className="rounded-2xl bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600"
              >
                Restaurant Guide
              </Link>

              <Link
                href="/field-sales-guide"
                className="rounded-2xl bg-sky-600 px-6 py-3 font-bold text-white transition hover:bg-sky-700"
              >
                Sales Guide
              </Link>

              <Link
                href="/"
                className="rounded-2xl border border-emerald-300 px-6 py-3 font-bold text-emerald-700 transition hover:bg-emerald-100"
              >
                Back To Homepage
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-black text-emerald-600">
              English Guide
            </h2>

            <div className="mt-6 space-y-5 leading-7 text-slate-700">
              <p>
                Riders are an important part of the SmartServeUK operational
                ecosystem. They connect restaurants, food hubs and customers.
              </p>

              <p>
                Riders should collect orders professionally, deliver food
                safely, communicate politely and follow delivery instructions.
              </p>

              <p>Registration information may include:</p>

              <ul className="list-disc space-y-2 pl-6">
                <li>Full name</li>
                <li>Mobile number</li>
                <li>Address</li>
                <li>Emergency contact</li>
                <li>Vehicle type</li>
                <li>Profile photo</li>
              </ul>

              <p>
                Riders must respect customers, restaurant staff and platform
                instructions.
              </p>

              <p>
                Safety is more important than speed. Riders should follow road
                safety rules and avoid unsafe delivery behaviour.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-green-200 bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-black text-green-600">
              বাংলা গাইড
            </h2>

            <div className="mt-6 space-y-5 leading-8 text-slate-700">
              <p>
                রাইডাররা SmartServeUK অপারেশনাল সিস্টেমের গুরুত্বপূর্ণ অংশ।
                তারা রেস্টুরেন্ট, ফুড হাব এবং গ্রাহকদের মধ্যে সংযোগ তৈরি করে।
              </p>

              <p>
                রাইডারদের পেশাদারভাবে অর্ডার সংগ্রহ করতে হবে, নিরাপদভাবে খাবার
                পৌঁছাতে হবে এবং ভদ্রভাবে যোগাযোগ করতে হবে।
              </p>

              <p>রেজিস্ট্রেশনের জন্য প্রয়োজন হতে পারে:</p>

              <ul className="list-disc space-y-2 pl-6">
                <li>পূর্ণ নাম</li>
                <li>মোবাইল নম্বর</li>
                <li>ঠিকানা</li>
                <li>জরুরি যোগাযোগ</li>
                <li>যানবাহনের ধরন</li>
                <li>প্রোফাইল ছবি</li>
              </ul>

              <p>
                রাইডারদের গ্রাহক, রেস্টুরেন্ট স্টাফ এবং প্ল্যাটফর্ম নির্দেশনা
                সম্মান করতে হবে।
              </p>

              <p>
                গতির চেয়ে নিরাপত্তা বেশি গুরুত্বপূর্ণ। রাইডারদের ট্রাফিক নিয়ম
                মেনে চলতে হবে।
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-teal-200 bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-black text-teal-600">
              اردو گائیڈ
            </h2>

            <div className="mt-6 space-y-5 leading-8 text-slate-700">
              <p>
                رائیڈرز SmartServeUK کے آپریشنل نظام کا ایک اہم حصہ ہیں۔
              </p>

              <p>
                رائیڈرز کو محفوظ اور پیشہ ورانہ انداز میں ڈیلیوری مکمل کرنی
                چاہیے۔
              </p>

              <p>رجسٹریشن کے لیے معلومات درکار ہو سکتی ہیں:</p>

              <ul className="list-disc space-y-2 pl-6">
                <li>مکمل نام</li>
                <li>موبائل نمبر</li>
                <li>پتہ</li>
                <li>گاڑی کی قسم</li>
              </ul>
            </div>
          </section>

          <section className="rounded-3xl border border-amber-200 bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-black text-amber-600">
              हिंदी गाइड
            </h2>

            <div className="mt-6 space-y-5 leading-8 text-slate-700">
              <p>
                राइडर्स SmartServeUK सिस्टम का महत्वपूर्ण हिस्सा हैं।
              </p>

              <p>
                राइडर्स को सुरक्षित और पेशेवर तरीके से डिलीवरी करनी चाहिए।
              </p>

              <p>रजिस्ट्रेशन के लिए ये जानकारी मांगी जा सकती है:</p>

              <ul className="list-disc space-y-2 pl-6">
                <li>पूरा नाम</li>
                <li>मोबाइल नंबर</li>
                <li>पता</li>
                <li>वाहन का प्रकार</li>
              </ul>
            </div>
          </section>
        </div>

        <section className="mt-10 rounded-3xl border border-emerald-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-black">
            Rider Professional Standard
          </h2>

          <p className="mt-4 leading-7 text-slate-600">
            SmartServeUK riders represent the platform in front of restaurants
            and customers. Professional conduct, safe delivery and respectful
            communication are essential.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/signup/rider"
              className="rounded-2xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700"
            >
              Apply As Rider
            </Link>

            <Link
              href="/"
              className="rounded-2xl border border-emerald-300 px-6 py-3 font-bold text-emerald-700 transition hover:bg-emerald-100"
            >
              Back To Homepage
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}