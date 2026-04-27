"use client";

import { useState } from "react";
import Link from "next/link";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type SalesSignupStatus = "new" | "reviewing" | "approved" | "rejected";

function normPhone(input: string) {
  return (input || "").replace(/\D/g, "");
}

export default function SalesSignupPage() {
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  async function submitSignup() {
    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    const cleanArea = area.trim();
    const cleanAddress = address.trim();
    const cleanNotes = notes.trim();

    if (cleanName.length < 2) {
      setMsg("Please enter full name");
      return;
    }

    if (normPhone(cleanPhone).length < 6) {
      setMsg("Please enter valid phone number");
      return;
    }

    if (cleanArea.length < 2) {
      setMsg("Please enter area / territory");
      return;
    }

    try {
      setSubmitting(true);
      setMsg("Saving...");

      const status: SalesSignupStatus = "new";

      await addDoc(collection(db, "sales_signups"), {
        fullName: cleanName,
        phone: cleanPhone,
        phoneNorm: normPhone(cleanPhone),
        email: cleanEmail,
        area: cleanArea,
        address: cleanAddress,
        notes: cleanNotes,
        status,
        reviewed: false,
        reviewedAt: null,
        reviewedBy: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setMsg("✅ Sales signup submitted");

      setFullName("");
      setPhone("");
      setEmail("");
      setArea("");
      setAddress("");
      setNotes("");

      alert("Sales signup submitted successfully");
    } catch (err) {
      console.error("submitSignup failed:", err);
      setMsg("❌ Failed to submit signup");
      alert("Failed to submit signup");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Sales Team Signup
          </h1>
          <p className="text-sm text-neutral-600">
            Register a field or sales person for review and approval
          </p>
        </div>

        <Link
          href="/"
          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
        >
          Back
        </Link>
      </div>

      <div className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Full Name
          </label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter full name"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Phone Number
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter mobile number"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Area / Territory
          </label>
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Dhaka / Chittagong / Sylhet / specific zone"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Address
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Optional address"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Experience, target area, references, comments"
            className="min-h-30 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none"
          />
        </div>

        <button
          onClick={submitSignup}
          disabled={submitting}
          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Submit Signup"}
        </button>

        {msg ? (
          <div className="text-sm font-medium text-neutral-700">{msg}</div>
        ) : null}
      </div>
    </div>
  );
}