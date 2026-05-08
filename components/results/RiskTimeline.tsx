"use client";

import { getDurationInsight } from "@/lib/malaysia-stats";
import type { SymptomAnswer, RiskLevel } from "@/lib/types";

interface Props {
  answers: Record<string, SymptomAnswer>;
  overallRisk: RiskLevel;
}

export function RiskTimeline({ answers, overallRisk }: Props) {
  const durationAnswer = answers["duration"];
  const durationValue =
    durationAnswer?.answer === "还没特别注意过"
      ? "none"
      : durationAnswer?.answer === "最近一两个月才开始"
        ? "1-2_months"
        : durationAnswer?.answer === "已经 3–6 个月了"
          ? "3-6_months"
          : durationAnswer?.answer === "超过半年，但都拖着没处理"
            ? "6-12_months"
            : durationAnswer?.answer === "一年以上了"
              ? "over_1_year"
              : "none";

  const insight = getDurationInsight(durationValue);
  const monthsAgo = insight.monthsAgo;

  // Position user's "started noticing" marker on timeline
  // Timeline shows: -12 months ←→ today ←→ +12 months
  const totalRange = 24; // months

  const userStartPos = ((12 - monthsAgo) / totalRange) * 100;

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-6">
      <h3 className="text-xl font-bold text-slate-800">
        ⏳ 你的健康时间线
      </h3>
      <p className="mt-1 text-base text-slate-600">
        从你发现症状的那一天，到现在，再到未来 1 年
      </p>

      {/* Past insight */}
      {monthsAgo > 0 && (
        <div
          className={`mt-4 rounded-xl p-4 ${
            insight.level === "very_late" || insight.level === "late"
              ? "bg-rose-50 text-rose-900"
              : insight.level === "moderate"
                ? "bg-amber-50 text-amber-900"
                : "bg-sky-50 text-sky-900"
          }`}
        >
          <div className="font-medium">{insight.message}</div>
        </div>
      )}

      {/* Timeline visual */}
      <div className="relative mt-8 mb-4 h-32">
        {/* Line */}
        <div className="absolute left-0 right-0 top-12 h-1 bg-gradient-to-r from-slate-300 via-emerald-400 to-emerald-500" />

        {/* User started noticing marker (past) */}
        {monthsAgo > 0 && (
          <div
            className="absolute top-2"
            style={{ left: `${userStartPos}%`, transform: "translateX(-50%)" }}
          >
            <div className="text-center">
              <div className="text-xl">⚠️</div>
              <div className="text-xs font-medium text-rose-700">
                {monthsAgo === 12 ? "1 年+" : `${monthsAgo} 个月前`}
              </div>
              <div className="text-xs text-slate-500">开始有症状</div>
            </div>
            <div className="mx-auto mt-1 h-3 w-3 rounded-full bg-rose-500 ring-4 ring-rose-200" />
          </div>
        )}

        {/* Today marker */}
        <div className="absolute top-2" style={{ left: "50%", transform: "translateX(-50%)" }}>
          <div className="text-center">
            <div className="text-xl">📍</div>
            <div className="text-xs font-bold text-slate-800">今天</div>
          </div>
          <div className="mx-auto mt-1 h-4 w-4 rounded-full bg-slate-900 ring-4 ring-slate-200" />
        </div>

        {/* +4 months milestone */}
        <div className="absolute top-14" style={{ left: `${50 + (4 / 24) * 100}%`, transform: "translateX(-50%)" }}>
          <div className="mx-auto h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-200" />
          <div className="mt-1 text-center">
            <div className="text-base">🌱</div>
            <div className="text-xs font-medium text-emerald-700">
              4 个月
            </div>
            <div className="text-xs text-slate-500">关键期</div>
          </div>
        </div>

        {/* +12 months */}
        <div className="absolute top-14 right-0" style={{ transform: "translateX(0)" }}>
          <div className="ml-auto h-3 w-3 rounded-full bg-emerald-600 ring-4 ring-emerald-200" />
          <div className="mt-1 text-right">
            <div className="text-base">📈</div>
            <div className="text-xs text-slate-500">1 年后</div>
          </div>
        </div>
      </div>

      {/* Future warning */}
      <div
        className={`mt-12 rounded-xl border-l-4 p-4 ${
          overallRisk === "high"
            ? "border-rose-500 bg-rose-50"
            : overallRisk === "medium"
              ? "border-amber-500 bg-amber-50"
              : "border-emerald-500 bg-emerald-50"
        }`}
      >
        <div className="text-base font-semibold text-slate-800">
          🌱 关键期：未来 4 个月
        </div>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">
          肾脏的修复是慢工出细活 — 一般需要持续保养 <strong>3-6 个月</strong>{" "}
          （建议至少 4 个月）才看得到改变。这段时间是黄金期，过了就要更长时间才能逆转。
        </p>
      </div>
    </div>
  );
}
