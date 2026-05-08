"use client";

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import type { RiskLevel } from "@/lib/types";

const colorMap: Record<RiskLevel, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
  unknown: "#94a3b8",
};

const labelMap: Record<RiskLevel, string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
  unknown: "未评估",
};

interface Props {
  title: string;
  icon: string;
  risk: RiskLevel;
}

export function RiskGauge({ title, icon, risk }: Props) {
  const score = risk === "low" ? 25 : risk === "medium" ? 60 : risk === "high" ? 90 : 0;
  const data = [{ name: title, value: score, fill: colorMap[risk] }];

  return (
    <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-base text-slate-600">
        <span className="mr-1">{icon}</span>
        {title}
      </div>
      <div className="h-32 w-full">
        <ResponsiveContainer>
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              background={{ fill: "#f1f5f9" }}
              dataKey="value"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div
        className="-mt-12 text-xl font-bold"
        style={{ color: colorMap[risk] }}
      >
        {labelMap[risk]}
      </div>
    </div>
  );
}
