import React from "react";

type StatCardProps = {
  title: string;
  value: string | number;       // ✅ allow number too
  footer?: React.ReactNode;      // ✅ optional footer
  highlight?: boolean;           // ✅ optional highlight
};

function showValue(v: string | number) {
  if (typeof v === "number") return v.toLocaleString("en-GB");
  return v;
}

export default function StatCard({ title, value, footer, highlight }: StatCardProps) {
  return (
    <div
      className={[
        "rounded-2xl border bg-white p-5 shadow-sm",
        highlight ? "border-green-300" : "border-neutral-200",
      ].join(" ")}
    >
      <div className="text-sm text-neutral-600">{title}</div>
      <div className="mt-2 text-3xl font-semibold">{showValue(value)}</div>

      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
}