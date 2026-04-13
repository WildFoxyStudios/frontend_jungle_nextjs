"use client";

import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface ActivityChartProps {
  data: { name: string; value: number; [key: string]: unknown }[];
  type?: "line" | "bar" | "area";
  dataKey?: string;
  color?: string;
  height?: number;
}

export function ActivityChart({
  data,
  type = "line",
  dataKey = "value",
  color = "#3b82f6",
  height = 300,
}: ActivityChartProps) {
  const commonProps = {
    data,
    margin: { top: 5, right: 10, left: 0, bottom: 5 },
  };

  const axisProps = (
    <>
      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} />
      <Tooltip />
    </>
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === "bar" ? (
        <BarChart {...commonProps}>
          {axisProps}
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : type === "area" ? (
        <AreaChart {...commonProps}>
          {axisProps}
          <Area type="monotone" dataKey={dataKey} stroke={color} fill={`${color}33`} />
        </AreaChart>
      ) : (
        <LineChart {...commonProps}>
          {axisProps}
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}
