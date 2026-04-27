"use client";

import React from "react";

function showMoney(n: any) {
  const num = Number(n ?? 0);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString("en-GB");
}

type MetricKey = "revenue" | "cost" | "profit";

export default function RevenueCostProfitBars({
  revenue,
  cost,
  profit,
  guests,
  onPickMetric,
  activeMetric,
}: {
  revenue: number;
  cost: number;
  profit: number;
  guests?: number | null;
  onPickMetric?: (k: MetricKey) => void;
  activeMetric?: MetricKey | null;
}) {
  const rev = Number(revenue ?? 0);
  const cst = Number(cost ?? 0);
  const prf = Number(profit ?? 0);
  const g = Number(guests ?? 0);

  // scale for bars (use biggest absolute so negative profit doesn't break)
  const scaleMax = Math.max(1, Math.abs(rev), Math.abs(cst), Math.abs(prf));

  // For the profit bar we want a "zero line" in the middle:
  // top half = positive, bottom half = negative
  const profitAbsPct = Math.min(100, (Math.abs(prf) / scaleMax) * 100);

  const profitPct =
    rev > 0 ? Math.round((prf / rev) * 1000) / 10 : null; // 1 decimal
  const profitPerGuest =
    g > 0 ? Math.round((prf / g) * 100) / 100 : null; // 2 decimals

  const pick = (k: MetricKey) => {
    if (onPickMetric) onPickMetric(k);
  };

  const Card = ({
    title,
    value,
    pct,
    keyName,
    barClass,
    showZeroLine,
    profitSign,
  }: {
    title: string;
    value: number;
    pct: number;
    keyName: MetricKey;
    barClass: string;
    showZeroLine?: boolean;
    profitSign?: "pos" | "neg" | "zero";
  }) => {
    const selected = activeMetric === keyName;

    return (
      <button
        type="button"
        onClick={() => pick(keyName)}
        className={[
          "w-full text-left rounded-2xl border bg-white p-4 shadow-sm transition",
          "hover:shadow-md",
          selected ? "ring-2 ring-neutral-900/20" : "",
        ].join(" ")}
      >
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold">{title}</div>
          {keyName === "profit" && value < 0 ? (
            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
              LOSS
            </span>
          ) : null}
        </div>

        {/* Bar area */}
        <div className="mt-3 rounded-xl bg-neutral-50 p-3">
          {showZeroLine ? (
            <div className="relative h-28 w-full rounded-xl bg-white overflow-hidden">
              {/* zero line */}
              <div className="absolute left-0 right-0 top-1/2 h-px bg-neutral-200" />

              {/* positive fills upward from center */}
              {profitSign === "pos" ? (
                <div
                  className={[
                    "absolute left-0 right-0 bottom-1/2 mx-3 rounded-lg",
                    barClass,
                  ].join(" ")}
                  style={{ height: `${profitAbsPct}%` }}
                  title={String(value)}
                />
              ) : null}

              {/* negative fills downward from center */}
              {profitSign === "neg" ? (
                <div
                  className={[
                    "absolute left-0 right-0 top-1/2 mx-3 rounded-lg",
                    barClass,
                  ].join(" ")}
                  style={{ height: `${profitAbsPct}%` }}
                  title={String(value)}
                />
              ) : null}

              {/* zero profit */}
              {profitSign === "zero" ? (
                <div className="absolute left-3 right-3 top-1/2 h-1 -translate-y-1/2 rounded bg-neutral-200" />
              ) : null}
            </div>
          ) : (
            <div className="relative h-28 w-full rounded-xl bg-white overflow-hidden">
              <div
                className={["absolute left-3 top-3 bottom-3 rounded-lg", barClass].join(" ")}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          )}
        </div>

        <div className="mt-3 text-lg font-bold">{showMoney(value)}</div>

        {/* extra metrics */}
        {keyName === "profit" ? (
          <div className="mt-1 text-sm text-neutral-600 space-y-1">
            <div>
              Profit %:{" "}
              <span className="font-semibold text-neutral-900">
                {profitPct === null ? "—" : `${profitPct}%`}
              </span>
            </div>
            <div>
              Profit / Guest:{" "}
              <span className="font-semibold text-neutral-900">
                {profitPerGuest === null ? "—" : showMoney(profitPerGuest)}
              </span>
            </div>
          </div>
        ) : null}
      </button>
    );
  };

  const revPct = (rev / scaleMax) * 100;
  const costPct = (cst / scaleMax) * 100;

  const profitSign: "pos" | "neg" | "zero" =
    prf > 0 ? "pos" : prf < 0 ? "neg" : "zero";

  const profitClass =
    prf < 0 ? "bg-red-600" : prf === 0 ? "bg-neutral-300" : "bg-green-700";

  return (
    <div className="rounded-2xl border bg-white p-5">
      
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card
          title="Revenue"
          value={rev}
          pct={revPct}
          keyName="revenue"
          barClass="bg-neutral-900"
        />

        <Card
          title="Cost"
          value={cst}
          pct={costPct}
          keyName="cost"
          barClass="bg-neutral-500"
        />

        <Card
          title="Profit"
          value={prf}
          pct={0}
          keyName="profit"
          barClass={profitClass}
          showZeroLine
          profitSign={profitSign}
        />
      </div>

      <div className="mt-3 text-xs text-neutral-500">
        Scale max: {showMoney(scaleMax)}
      </div>
    </div>
  );
}