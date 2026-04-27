"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Locked() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="border rounded-xl p-6 max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">🔒 অ্যাপ লক</h1>

        <p className="text-gray-800">
          আপনার সাবস্ক্রিপশন শেষ হয়েছে।  
          পেমেন্ট ছাড়া অ্যাপ ব্যবহার করা যাবে না।
        </p>

        <p className="text-sm text-gray-600">
          পেমেন্টের জন্য যোগাযোগ করুন:
          <br />
          <b>01XXXXXXXXX</b>
        </p>

        <button
          className="border rounded px-4 py-2"
          onClick={async () => {
            await signOut(auth);
            window.location.href = "/login";
          }}
        >
          লগআউট
        </button>
      </div>
    </div>
  );
}