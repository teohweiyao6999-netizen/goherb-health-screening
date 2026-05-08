"use client";

import { QUESTIONS, getModuleLabel } from "@/lib/questions";
import type { SymptomAnswer } from "@/lib/types";

interface Props {
  answers: Record<string, SymptomAnswer>;
}

const moduleEmoji: Record<string, string> = {
  kidney: "🫘",
  blood_pressure: "❤️",
  blood_sugar: "🩸",
  lifestyle: "🌿",
  duration: "⏰",
};

const moduleOrder = ["kidney", "blood_pressure", "blood_sugar", "lifestyle"];

function dotClass(score: number): string {
  if (score >= 2) return "bg-rose-500 ring-rose-300";
  if (score === 1) return "bg-amber-400 ring-amber-200";
  return "bg-emerald-500 ring-emerald-200";
}

export function LightMap({ answers }: Props) {
  // Group questions by module
  const byModule: Record<string, typeof QUESTIONS> = {};
  for (const q of QUESTIONS) {
    if (q.module === "duration") continue; // skip duration in light map
    if (!byModule[q.module]) byModule[q.module] = [];
    byModule[q.module].push(q);
  }

  // Count red lights per module
  const moduleStats = moduleOrder.map((m) => {
    const qs = byModule[m] ?? [];
    const red = qs.filter((q) => (answers[q.id]?.score ?? 0) >= 2).length;
    const yellow = qs.filter((q) => (answers[q.id]?.score ?? 0) === 1).length;
    return { module: m, total: qs.length, red, yellow, qs };
  });

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-6">
      <h3 className="text-xl font-bold text-slate-800">
        🗺️ 你的 30 题「亮灯地图」
      </h3>
      <p className="mt-1 text-base text-slate-600">
        🔴 红灯 = 高风险信号 · 🟡 黄灯 = 要注意 · 🟢 绿灯 = 没问题
      </p>

      <div className="mt-5 space-y-4">
        {moduleStats.map((stat) => (
          <div key={stat.module}>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-base font-semibold text-slate-700">
                {moduleEmoji[stat.module]} {getModuleLabel(stat.module)}
                <span className="ml-2 text-sm text-slate-500">
                  （{stat.total} 题）
                </span>
              </div>
              <div className="text-sm">
                {stat.red > 0 && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-700">
                    🔴 {stat.red} 颗
                  </span>
                )}
                {stat.yellow > 0 && (
                  <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                    🟡 {stat.yellow} 颗
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {stat.qs.map((q) => {
                const a = answers[q.id];
                const score = a?.score ?? 0;
                return (
                  <div
                    key={q.id}
                    title={`${q.text} → ${a?.answer ?? "未作答"}`}
                    className={`h-5 w-5 rounded-full ring-4 ${dotClass(score)}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
