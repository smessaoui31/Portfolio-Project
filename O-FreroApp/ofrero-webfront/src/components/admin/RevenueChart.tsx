"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface RevenueChartProps {
  data: { date: string; revenue: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const formattedData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    revenue: item.revenue / 100, // Convert cents to euros
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
          <XAxis dataKey="date" stroke="#a3a3a3" fontSize={12} />
          <YAxis stroke="#a3a3a3" fontSize={12} tickFormatter={(value) => `${value}€`} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#171717",
              border: "1px solid #404040",
              borderRadius: "8px",
              color: "#fff",
            }}
            formatter={(value: number) => [`${value.toFixed(2)}€`, "Revenus"]}
            labelStyle={{ color: "#a3a3a3" }}
          />
          <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
