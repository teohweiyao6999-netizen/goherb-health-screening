"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import type { AnalysisResult } from "@/lib/types";
import { getMalaysiaAverageScore } from "@/lib/malaysia-stats";

interface Props {
  result: AnalysisResult;
  age: number;
}

const riskScore: Record<string, number> = {
  low: 25,
  medium: 60,
  high: 90,
  unknown: 0,
};

export function ComparisonChart({ result, age }: Props) {
  const avg = getMalaysiaAverageScore(age);

  const data = [
    {
      name: "整体",
      你: result.overallScore,
      马来西亚平均: avg.overall,
    },
    {
      name: "🫘 肾脏",
      你: riskScore[result.systems.kidney?.risk ?? "unknown"],
      马来西亚平均: avg.kidney,
    },
    {
      name: "❤️ 血压",
      你: riskScore[result.systems.blood_pressure?.risk ?? "unknown"],
      马来西亚平均: avg.bp,
    },
    {
      name: "🩸 血糖",
      你: riskScore[result.systems.blood_sugar?.risk ?? "unknown"],
      马来西亚平均: avg.sugar,
    },
  ];

  const yourTotal = result.overallScore;
  const avgTotal = avg.overall;
  const diffPct = Math.round(((yourTotal - avgTotal) / Math.max(avgTotal, 1)) * 100);

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-6">
      <h3 className="text-xl font-bold text-slate-800">
        📊 你 vs 马来西亚同龄人
      </h3>
      <p className="mt-1 text-base text-slate-600">
        和你同年龄段的马来西亚成年人比较（数据来源：NHMS 2019）
      </p>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 13 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            />
            <Bar dataKey="马来西亚平均" fill="#94a3b8" radius={[6, 6, 0, 0]}>
              <LabelList dataKey="马来西亚平均" position="top" fontSize={11} />
            </Bar>
            <Bar dataKey="你" radius={[6, 6, 0, 0]}>
              <LabelList dataKey="你" position="top" fontSize={11} fill="#0f172a" />
              {data.map((d, i) => {
                const v = d.你;
                const fill =
                  v >= 65 ? "#dc2626" : v >= 35 ? "#d97706" : "#10b981";
                return <Cell key={i} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div
        className={`mt-4 rounded-xl p-4 ${
          diffPct > 20
            ? "bg-rose-50 text-rose-900"
            : diffPct > 0
              ? "bg-amber-50 text-amber-900"
              : "bg-emerald-50 text-emerald-900"
        }`}
      >
        {diffPct > 20 && (
          <p className="text-base font-medium">
            ⚠️ 你的整体风险比马来西亚同龄人高出{" "}
            <span className="text-xl font-bold">{diffPct}%</span>，需要立刻关注
          </p>
        )}
        {diffPct > 0 && diffPct <= 20 && (
          <p className="text-base font-medium">
            ⚠️ 你的整体风险比马来西亚同龄人略高 {diffPct}%，要小心了
          </p>
        )}
        {diffPct <= 0 && (
          <p className="text-base font-medium">
            ✓ 你的风险评分低于马来西亚同龄人 {Math.abs(diffPct)}%，继续保持
          </p>
        )}
      </div>
    </div>
  );
}
