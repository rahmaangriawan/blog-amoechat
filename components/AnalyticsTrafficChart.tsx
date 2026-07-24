"use client";

import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartItem = {
  label: string;
  users: number;
  sessions: number;
};

export function AnalyticsTrafficChart({ data }: { data: ChartItem[] }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    function updateWidth() {
      if (!element) return;
      const width = Math.floor(element.getBoundingClientRect().width);
      setChartWidth(width > 0 ? width : 0);
    }

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="h-[280px] min-w-0 w-full">
      {chartWidth > 0 ? (
        <AreaChart width={chartWidth} height={280} data={data} margin={{ top: 12, right: 8, bottom: 0, left: -28 }}>
          <defs>
            <linearGradient id="analyticsUsersFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#08cb52" stopOpacity={0.26} />
              <stop offset="95%" stopColor="#08cb52" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="analyticsSessionsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(8,8,8,0.08)" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgba(8,8,8,0.58)", fontSize: 12, fontWeight: 700 }}
            dy={10}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgba(8,8,8,0.48)", fontSize: 12, fontWeight: 700 }}
          />
          <Tooltip
            cursor={{ stroke: "rgba(8,203,82,0.22)", strokeWidth: 2 }}
            contentStyle={{
              border: "1px solid rgba(8,8,8,0.08)",
              borderRadius: 12,
              boxShadow: "0 16px 40px rgba(8,8,8,0.08)",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, fontWeight: 700 }}
            formatter={(value) => (value === "users" ? "Pengguna aktif" : "Sesi")}
          />
          <Area
            type="monotone"
            dataKey="users"
            name="users"
            stroke="#08cb52"
            strokeWidth={3}
            fill="url(#analyticsUsersFill)"
            activeDot={{ r: 5, strokeWidth: 3, stroke: "#fff", fill: "#08cb52" }}
          />
          <Area
            type="monotone"
            dataKey="sessions"
            name="sessions"
            stroke="#2563eb"
            strokeWidth={2}
            fill="url(#analyticsSessionsFill)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: "#2563eb" }}
          />
        </AreaChart>
      ) : null}
    </div>
  );
}
