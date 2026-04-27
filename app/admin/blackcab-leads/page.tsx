"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as XLSX from "xlsx";

type BlackCabLeadStatus = "new" | "contacted" | "quoted" | "booked" | "cancelled";

type BlackCabLead = {
  id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  journeyType?: string;
  notes?: string;
  source?: string;
  status?: BlackCabLeadStatus;
};

export default function BlackCabLeadsPage() {
  const [leads, setLeads] = useState<BlackCabLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [journeyFilter, setJourneyFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const q = query(
          collection(db, "blackcab_early_access"),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        const data: BlackCabLead[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<BlackCabLead, "id">),
        }));

        setLeads(data);
      } catch (error) {
        console.error("Error fetching leads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const filteredLeads = leads.filter((lead) => {
    const q = searchTerm.toLowerCase();

    const matchesSearch =
      (lead.fullName || "").toLowerCase().includes(q) ||
      (lead.email || "").toLowerCase().includes(q) ||
      (lead.phone || "").toLowerCase().includes(q);

    const matchesJourney =
      journeyFilter === "All" || lead.journeyType === journeyFilter;

    const leadStatus = lead.status || "new";
    const matchesStatus =
      statusFilter === "All" || leadStatus === statusFilter;

    return matchesSearch && matchesJourney && matchesStatus;
  });

  const handleExport = () => {
    const data = filteredLeads.map((lead) => ({
      Name: lead.fullName || "",
      Email: lead.email || "",
      Phone: lead.phone || "",
      "Journey Type": lead.journeyType || "",
      Status: lead.status || "new",
      Notes: lead.notes || "",
      Source: lead.source || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    worksheet["!cols"] = [
      { wch: 22 },
      { wch: 30 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 40 },
      { wch: 24 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `blackcab_leads_${today}.xlsx`);
  };

  const handleStatusChange = async (
    leadId: string,
    nextStatus: BlackCabLeadStatus
  ) => {
    const previous = [...leads];

    setLeads((current) =>
      current.map((lead) =>
        lead.id === leadId ? { ...lead, status: nextStatus } : lead
      )
    );

    setSavingId(leadId);

    try {
      await updateDoc(doc(db, "blackcab_early_access", leadId), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating lead status:", error);
      setLeads(previous);
    } finally {
      setSavingId(null);
    }
  };

  const getStatusBadgeClasses = (status?: BlackCabLeadStatus) => {
    switch (status || "new") {
      case "new":
        return "border-sky-500/30 bg-sky-500/10 text-sky-300";
      case "contacted":
        return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
      case "quoted":
        return "border-purple-500/30 bg-purple-500/10 text-purple-300";
      case "booked":
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
      case "cancelled":
        return "border-red-500/30 bg-red-500/10 text-red-300";
      default:
        return "border-neutral-700 bg-neutral-800 text-neutral-300";
    }
  };

  const totalNew = leads.filter((lead) => (lead.status || "new") === "new").length;
  const totalContacted = leads.filter(
    (lead) => (lead.status || "new") === "contacted"
  ).length;
  const totalQuoted = leads.filter(
    (lead) => (lead.status || "new") === "quoted"
  ).length;
  const totalBooked = leads.filter(
    (lead) => (lead.status || "new") === "booked"
  ).length;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* HEADER */}
      <section className="border-b border-neutral-800 bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="inline-flex rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1 text-sm font-medium text-yellow-300">
              Admin Dashboard
            </div>

            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white">
              Black Cab Early Access Leads
            </h1>

            <p className="mt-4 text-neutral-400">
              View, filter, export, and update customer interest collected from
              the Black Cab landing page.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <div className="rounded-full border border-neutral-800 bg-neutral-900 px-4 py-1 text-neutral-300">
                Total Leads:{" "}
                <span className="font-semibold text-white">
                  {loading ? "..." : leads.length}
                </span>
              </div>

              <div className="rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1 text-sky-300">
                New: <span className="font-semibold">{loading ? "..." : totalNew}</span>
              </div>

              <div className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1 text-yellow-300">
                Contacted:{" "}
                <span className="font-semibold">{loading ? "..." : totalContacted}</span>
              </div>

              <div className="rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1 text-purple-300">
                Quoted:{" "}
                <span className="font-semibold">{loading ? "..." : totalQuoted}</span>
              </div>

              <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-emerald-300">
                Booked:{" "}
                <span className="font-semibold">{loading ? "..." : totalBooked}</span>
              </div>

              {!loading && (
                <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-emerald-300">
                  Data synced
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* SEARCH + FILTER */}
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-300">
                Search Leads
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or phone"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder:text-neutral-500 outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-300">
                Filter by Journey Type
              </label>
              <select
                value={journeyFilter}
                onChange={(e) => setJourneyFilter(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
              >
                <option>All</option>
                <option>Airport Transfer</option>
                <option>Hotel Pickup</option>
                <option>Business Travel</option>
                <option>City Journey</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-300">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
              >
                <option value="All">All</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="quoted">Quoted</option>
                <option value="booked">Booked</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleExport}
                className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
              >
                Export to Excel
              </button>
            </div>
          </div>

          {/* DATA */}
          {loading ? (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-neutral-300">
              Loading leads...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-neutral-300">
              No early access leads found yet.
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredLeads.map((lead) => {
                const leadStatus = lead.status || "new";

                return (
                  <div
                    key={lead.id}
                    className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
                  >
                    <div className="mb-5 flex flex-col gap-3 border-b border-neutral-800 pb-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-lg font-bold text-white">
                          {lead.fullName || "Unnamed Lead"}
                        </div>

                        <div
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusBadgeClasses(
                            leadStatus
                          )}`}
                        >
                          {leadStatus}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <select
                          value={leadStatus}
                          onChange={(e) =>
                            handleStatusChange(
                              lead.id,
                              e.target.value as BlackCabLeadStatus
                            )
                          }
                          disabled={savingId === lead.id}
                          className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-white outline-none focus:border-yellow-400 disabled:opacity-60"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="quoted">Quoted</option>
                          <option value="booked">Booked</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        {savingId === lead.id && (
                          <div className="text-xs text-yellow-300">Saving...</div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <div>
                        <div className="text-xs text-yellow-400">Full Name</div>
                        <div className="text-white">{lead.fullName || "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs text-yellow-400">Email</div>
                        <div>{lead.email || "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs text-yellow-400">Phone</div>
                        <div>{lead.phone || "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs text-yellow-400">Journey Type</div>
                        <div>{lead.journeyType || "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs text-yellow-400">Source</div>
                        <div>{lead.source || "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs text-yellow-400">Lead ID</div>
                        <div className="break-all text-neutral-300">{lead.id}</div>
                      </div>

                      <div className="md:col-span-2 xl:col-span-3">
                        <div className="text-xs text-yellow-400">Notes</div>
                        <div className="text-neutral-200">{lead.notes || "—"}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}