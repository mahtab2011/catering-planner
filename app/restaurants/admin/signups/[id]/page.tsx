"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  collection,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type SignupStatus =
  | "new"
  | "reviewing"
  | "contacted"
  | "approved"
  | "rejected";

type SignupData = {
  id: string;
  restaurantName?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  hubId?: string;
  hubName?: string;
  area?: string;
  cuisine?: string;
  notes?: string;
  status?: SignupStatus;
  restaurantCreated?: boolean;

  // backward compatibility
  name?: string;
  owner?: string;
  hub?: string;
};

export default function SignupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [data, setData] = useState<SignupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setMsg("");
      setData(null);

      console.log("Signup detail route id:", id);

      const ref = doc(db, "restaurant_signups", id);
      const snap = await getDoc(ref);

      console.log("Document exists:", snap.exists());
      console.log("Document data:", snap.data());

      if (!snap.exists()) {
        setMsg(`Signup not found for id: ${id}`);
        setData(null);
        return;
      }

      setData({
        id: snap.id,
        ...(snap.data() as Omit<SignupData, "id">),
      });
    } catch (e) {
      console.error("Failed to load signup:", e);
      setMsg("Failed to load signup");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  async function updateStatus(status: SignupStatus) {
    try {
      setSaving(true);
      setMsg("");

      await updateDoc(doc(db, "restaurant_signups", id), {
        status,
        updatedAt: serverTimestamp(),
      });

      setData((prev) => (prev ? { ...prev, status } : prev));
      setMsg("Status updated");
    } catch (e) {
      console.error("Failed to update status:", e);
      setMsg("Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  async function createRestaurant() {
    try {
      setSaving(true);
      setMsg("");

      if (!data) {
        setMsg("No signup data loaded");
        return;
      }

      if (data.status !== "approved") {
        setMsg("Only approved signups can be converted");
        return;
      }

      if (data.restaurantCreated) {
        setMsg("Restaurant already created");
        return;
      }

      const restaurant = {
        name: data.restaurantName || data.name || "",
        ownerName: data.ownerName || data.owner || "",
        phone: data.phone || "",
        email: data.email || "",
        hubId: data.hubId || "",
        hubName: data.hubName || data.hub || "",
        area: data.area || "",
        cuisine: data.cuisine || "",
        shortDescription: "",
        tags: [],
        popularItems: [],
        status: "active",
        subscriptionPlan: "free",
        sourceSignupId: id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "restaurants"), restaurant);

      await updateDoc(doc(db, "restaurant_signups", id), {
        restaurantCreated: true,
        updatedAt: serverTimestamp(),
      });

      setData((prev) =>
        prev
          ? {
              ...prev,
              restaurantCreated: true,
            }
          : prev
      );

      setMsg("✅ Restaurant created successfully!");
    } catch (e) {
      console.error("Failed to create restaurant:", e);
      setMsg("Failed to create restaurant");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-lg font-semibold text-neutral-900">
          No data found
        </div>

        {msg ? (
          <div className="mt-2 text-sm text-neutral-600">{msg}</div>
        ) : null}

        <div className="mt-2 text-sm text-neutral-500">
          Requested id: {id || "—"}
        </div>

        <div className="mt-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-neutral-600 underline"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-neutral-900">Signup Details</h1>

        {msg ? (
          <div className="mt-4 rounded bg-neutral-100 p-3 text-sm text-neutral-700">
            {msg}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Document ID" value={data.id} />
          <Field label="Restaurant" value={data.restaurantName || data.name} />
          <Field label="Owner" value={data.ownerName || data.owner} />
          <Field label="Phone" value={data.phone} />
          <Field label="Email" value={data.email} />
          <Field label="Hub" value={data.hubName || data.hub} />
          <Field label="Area" value={data.area} />
          <Field label="Cuisine" value={data.cuisine} />
          <Field label="Status" value={data.status} />
        </div>

        {data.notes ? (
          <div className="mt-6">
            <div className="text-sm font-semibold text-neutral-900">Notes</div>
            <div className="mt-1 rounded bg-neutral-100 p-3 text-sm text-neutral-700">
              {data.notes}
            </div>
          </div>
        ) : null}

        <div className="mt-6">
          <div className="mb-2 text-sm font-semibold text-neutral-900">
            Update status
          </div>

          <div className="flex flex-wrap gap-2">
            {["new", "reviewing", "contacted", "approved", "rejected"].map(
              (s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s as SignupStatus)}
                  disabled={saving}
                  className="rounded bg-neutral-200 px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-300 disabled:opacity-50"
                >
                  {s}
                </button>
              )
            )}
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={createRestaurant}
            disabled={saving || data.restaurantCreated}
            className="rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {data.restaurantCreated
              ? "Restaurant Created"
              : "Create Restaurant Profile"}
          </button>
        </div>

        <div className="mt-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-neutral-600 underline"
          >
            ← Back
          </button>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-sm font-medium text-neutral-900">{value || "—"}</div>
    </div>
  );
}