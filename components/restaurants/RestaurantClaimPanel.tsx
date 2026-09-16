"use client";

import NextLink from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { onAuthStateChanged, type User } from "firebase/auth";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { RestaurantOwnerClaimStatus, RestaurantRequestType } from "@/lib/types";

type Props = {
  restaurantId: string;
  restaurantName: string;
  ownerUid?: string;
  ownerClaimStatus?: RestaurantOwnerClaimStatus;
};

/**
 * Claim / suggest-update / request-removal actions for a restaurant
 * detail page — see docs/RESTAURANT-CLAIM-WORKFLOW.md.
 *
 * Claiming writes ONLY `claimantUid` (to the signed-in user) and
 * `ownerClaimStatus` ('claim_pending') on the restaurant document —
 * never `ownerUid`. firestore.rules enforces this independently of
 * this component (see the restaurants/{restaurantId} update rule's
 * claim-submission branch); this UI just gives it a legitimate path
 * to trigger, and never attempts to write ownerUid itself.
 *
 * Correction/removal requests are written to a separate
 * restaurant_correction_requests collection and never touch the
 * restaurant document directly — an admin reviews them and makes any
 * actual edit by hand.
 *
 * /login is a SmartServeUK operational route outside the app/[locale]
 * subtree, so it's linked with plain next/link — never the
 * locale-aware Link from @/i18n/navigation used elsewhere on the
 * restaurant detail page.
 */
export default function RestaurantClaimPanel({
  restaurantId,
  restaurantName,
  ownerUid,
  ownerClaimStatus,
}: Props) {
  const t = useTranslations("ClaimActions");
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [openRequestType, setOpenRequestType] = useState<RestaurantRequestType | null>(null);
  const [requestNote, setRequestNote] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setCheckingAuth(false);
    });
    return () => unsub();
  }, []);

  const isUnclaimed = !ownerUid;
  const canSubmitClaim =
    isUnclaimed && (ownerClaimStatus === undefined || ownerClaimStatus === "unclaimed" || ownerClaimStatus === "claim_rejected");

  async function submitClaim() {
    if (!user) return;
    setClaiming(true);
    setClaimMessage("");
    try {
      await updateDoc(doc(db, "restaurants", restaurantId), {
        claimantUid: user.uid,
        ownerClaimStatus: "claim_pending",
        claimSubmittedAt: serverTimestamp(),
      });
      setClaimMessage(t("claimSubmittedMessage"));
    } catch (err) {
      console.error("Failed to submit claim:", err);
      setClaimMessage(t("claimErrorMessage"));
    } finally {
      setClaiming(false);
    }
  }

  async function submitRequest() {
    if (!user || !openRequestType) return;
    setSubmittingRequest(true);
    setRequestMessage("");
    try {
      await addDoc(collection(db, "restaurant_correction_requests"), {
        restaurantId,
        requestType: openRequestType,
        submittedByUid: user.uid,
        submittedByEmail: user.email || "",
        ...(openRequestType === "correction"
          ? { suggestedValueNote: requestNote }
          : { reasonNote: requestNote }),
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setRequestMessage(t("requestSubmittedMessage"));
      setRequestNote("");
      setOpenRequestType(null);
    } catch (err) {
      console.error("Failed to submit request:", err);
      setRequestMessage(t("requestErrorMessage"));
    } finally {
      setSubmittingRequest(false);
    }
  }

  if (checkingAuth) return null;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
      <div className="text-sm font-semibold text-neutral-900">{t("manageListing")}</div>

      {isUnclaimed ? (
        <div className="mt-3">
          {ownerClaimStatus === "claim_pending" ? (
            <p className="text-sm text-neutral-600">{t("claimUnderReview")}</p>
          ) : canSubmitClaim ? (
            <>
              <p className="text-sm text-neutral-600">
                {t("isYourBusiness", { name: restaurantName })}
              </p>
              {user ? (
                <button
                  type="button"
                  onClick={submitClaim}
                  disabled={claiming}
                  className="mt-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  {claiming ? t("submitting") : t("claimListing")}
                </button>
              ) : (
                <NextLink
                  href="/login"
                  className="mt-2 inline-block rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  {t("logInToClaim")}
                </NextLink>
              )}
              {claimMessage ? <p className="mt-2 text-sm text-neutral-700">{claimMessage}</p> : null}
            </>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {user ? (
          <>
            <button
              type="button"
              onClick={() => setOpenRequestType("correction")}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              {t("suggestUpdate")}
            </button>
            <button
              type="button"
              onClick={() => setOpenRequestType("removal")}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              {t("requestRemoval")}
            </button>
          </>
        ) : (
          <NextLink
            href="/login"
            className="text-sm font-semibold text-amber-700 hover:underline"
          >
            {t("logInToSuggest")}
          </NextLink>
        )}
      </div>

      {openRequestType ? (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-semibold text-neutral-900">
            {openRequestType === "correction" ? t("suggestUpdate") : t("requestRemoval")}
          </div>
          <textarea
            value={requestNote}
            onChange={(e) => setRequestNote(e.target.value)}
            placeholder={
              openRequestType === "correction" ? t("correctionPlaceholder") : t("removalPlaceholder")
            }
            rows={3}
            className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={submitRequest}
              disabled={submittingRequest || !requestNote.trim()}
              className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {submittingRequest ? t("submitting") : t("submit")}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenRequestType(null);
                setRequestNote("");
              }}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : null}

      {requestMessage ? <p className="mt-3 text-sm text-neutral-700">{requestMessage}</p> : null}
    </div>
  );
}
