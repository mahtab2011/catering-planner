"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";

type Row = {
  Month: string;   // "2026-02"
  Revenue: number;
  Cost: number;
  Profit: number;
};

function showMoney(n: any) {
  const num = Number(n ?? 0);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString("en-GB");
}

export default function MonthlyTrendChart({ data }: { data: Row[] }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2 font-semibold">
        <span>📊</span>
        <span>Monthly Revenue / Cost / Profit</span>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, left: 0, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="Month"
              tickFormatter={(v) => {
                const [y, m] = String(v).split("-");
                return `${m}/${y.slice(2)}`; // 02/26
              }}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={60}
            />

            <YAxis tickFormatter={(v) => showMoney(v)} />

            <Tooltip
              formatter={(value: any) => showMoney(value)}
              labelFormatter={(label: any) => `Month: ${label}`}
            />

            <Legend />

            <Bar dataKey="Revenue" name="Revenue" />
            <Bar dataKey="Cost" name="Cost" />

            {/* Profit bar turns red if negative */}
            <Bar dataKey="Profit" name="Profit">
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={Number(entry.Profit) < 0 ? "#dc2626" : "#16a34a"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}