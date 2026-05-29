import Link from "next/link";

export default function FieldSalesGuidePage() {
  return (
    <main className="min-h-screen bg-sky-50 text-slate-900">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl border border-sky-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
                SmartServeUK
              </p>

              <h1 className="mt-2 text-4xl font-black">
                Field Sales Guide: Helping Restaurants Sign Up
             </h1>

              <p className="mt-4 max-w-3xl text-lg text-slate-600">
                Practical guide for sales teams approaching restaurants,
                explaining SmartServeUK and supporting signups.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
  <Link
    href="/sales-signup"
    className="rounded-2xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700"
  >
    Join Sales Team
  </Link>

  <Link
    href="/restaurant-onboarding-guide"
    className="rounded-2xl bg-sky-600 px-6 py-3 font-bold text-white transition hover:bg-sky-700"
  >
    Restaurant Guide
  </Link>

  <Link
    href="/"
    className="rounded-2xl border border-sky-300 px-6 py-3 font-bold text-sky-700 transition hover:bg-sky-100"
  >
    Back To Homepage
  </Link>
</div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section className="rounded-3xl border border-sky-200 bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-black text-sky-600">
              English Guide
            </h2>

            <div className="mt-6 space-y-5 leading-7 text-slate-700">
              <p>
                Field representatives should approach restaurant owners with
                respect, patience and professionalism.
              </p>

              <p>
                Do not begin by selling aggressively. First listen, understand
                the restaurant and explain the platform simply.
              </p>

              <p>
                Best approach times are usually before lunch rush or between
                lunch and dinner periods.
              </p>

              <ul className="list-disc space-y-2 pl-6">
                <li>Introduce SmartServeUK clearly</li>
                <li>Explain digital visibility</li>
                <li>Explain founding restaurant offer</li>
                <li>Collect restaurant details</li>
                <li>Support signup if the owner agrees</li>
                <li>Follow up politely if they need time</li>
              </ul>

              <p>
                Never make false promises or guarantee sales. Focus on visibility,
                local discovery and long-term digital support.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-green-200 bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-black text-green-600">
              বাংলা গাইড
            </h2>

            <div className="mt-6 space-y-5 leading-8 text-slate-700">
              <p>
                ফিল্ড প্রতিনিধিদের রেস্টুরেন্ট মালিকদের সাথে সম্মান, ধৈর্য
                এবং পেশাদার আচরণের মাধ্যমে যোগাযোগ করতে হবে।
              </p>

              <p>
                শুরুতেই জোর করে বিক্রি করার চেষ্টা করবেন না। আগে শুনুন,
                বুঝুন, তারপর সহজ ভাষায় SmartServeUK বুঝান।
              </p>

              <p>
                রেস্টুরেন্টে যাওয়ার ভালো সময় সাধারণত লাঞ্চের আগে অথবা লাঞ্চ
                ও ডিনারের মাঝামাঝি সময়।
              </p>

              <ul className="list-disc space-y-2 pl-6">
                <li>SmartServeUK পরিষ্কারভাবে পরিচয় করান</li>
                <li>ডিজিটাল দৃশ্যমানতার সুবিধা বুঝান</li>
                <li>ফাউন্ডিং রেস্টুরেন্ট অফার বুঝান</li>
                <li>রেস্টুরেন্টের তথ্য সংগ্রহ করুন</li>
                <li>মালিক রাজি হলে সাইনআপে সহায়তা করুন</li>
                <li>সময় চাইলে ভদ্রভাবে ফলোআপ করুন</li>
              </ul>

              <p>
                কখনো মিথ্যা প্রতিশ্রুতি দেবেন না বা বিক্রি নিশ্চিত করার কথা
                বলবেন না। মূল লক্ষ্য হলো দৃশ্যমানতা, লোকাল পরিচিতি ও দীর্ঘমেয়াদী
                ডিজিটাল সহায়তা।
              </p>
            </div>
          </section>
        </div>

        <section className="mt-10 rounded-3xl border border-sky-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-black">
            Sales Team Reminder
          </h2>

          <p className="mt-4 leading-7 text-slate-600">
            SmartServeUK representatives should build long-term trust with
            restaurants. Professional behaviour, honesty and respectful follow-up
            are more important than pressure-based selling.
          </p>
        </section>
      </section>
    </main>
  );
}