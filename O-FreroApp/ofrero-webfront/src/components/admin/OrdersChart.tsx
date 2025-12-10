"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface OrdersChartProps {
  data: { date: string; count: number }[];
}

export function OrdersChart({ data }: OrdersChartProps) {
  const formattedData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    count: item.count,
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
          <XAxis dataKey="date" stroke="#a3a3a3" fontSize={12} />
          <YAxis stroke="#a3a3a3" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#171717",
              border: "1px solid #404040",
              borderRadius: "8px",
              color: "#fff",
            }}
            formatter={(value: number) => [value, "Commandes"]}
            labelStyle={{ color: "#a3a3a3" }}
          />
          <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOrders)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
