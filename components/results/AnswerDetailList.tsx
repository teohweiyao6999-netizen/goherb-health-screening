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

const moduleOrder = [
  "kidney",
  "blood_pressure",
  "blood_sugar",
  "lifestyle",
  "duration",
];

function lightFor(score: number): { dot: string; label: string } {
  if (score >= 2) return { dot: "🔴", label: "需注意" };
  if (score === 1) return { dot: "🟡", label: "留意" };
  return { dot: "🟢", label: "正常" };
}

export function AnswerDetailList({ answers }: Props) {
  // Group questions by module
  const byModule: Record<string, typeof QUESTIONS> = {};
  for (const q of QUESTIONS) {
    if (!byModule[q.module]) byModule[q.module] = [];
    byModule[q.module].push(q);
  }

  // Overall counts
  let red = 0,
    yellow = 0,
    green = 0;
  for (const q of QUESTIONS) {
    if (q.module === "duration") continue;
    const s = answers[q.id]?.score ?? 0;
    if (s >= 2) red++;
    else if (s === 1) yellow++;
    else green++;
  }

  let questionNumber = 0;

  return (
    <details className="group rounded-2xl border-2 border-slate-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between p-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800">
            📋 你的完整答案明细
          </h3>
          <p className="mt-1 text-base text-slate-600">
            这份报告完全根据你的回答生成 ·{" "}
            <span className="font-semibold text-rose-600">🔴 {red}</span>{" "}
            <span className="font-semibold text-amber-600">🟡 {yellow}</span>{" "}
            <span className="font-semibold text-emerald-600">🟢 {green}</span>
          </p>
        </div>
        <span className="text-base text-slate-500 group-open:hidden">
          点击展开 ▾
        </span>
        <span className="hidden text-base text-slate-500 group-open:inline">
          收起 ▴
        </span>
      </summary>

      <div className="space-y-5 border-t border-slate-100 p-6">
        {moduleOrder.map((m) => {
          const qs = byModule[m];
          if (!qs?.length) return null;
          return (
            <div key={m}>
              <div className="mb-2 text-base font-semibold text-slate-700">
                {moduleEmoji[m]} {getModuleLabel(m)}
              </div>
              <div className="space-y-2">
                {qs.map((q) => {
                  questionNumber++;
                  const a = answers[q.id];
                  const score = a?.score ?? 0;
                  const light = lightFor(score);
                  return (
                    <div
                      key={q.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                    >
                      <div className="flex gap-2 text-sm text-slate-600">
                        <span className="font-semibold text-slate-400">
                          {questionNumber}.
                        </span>
                        <span>{q.text}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 pl-5">
                        <span>{light.dot}</span>
                        <span className="text-base font-medium text-slate-800">
                          {a?.answer ?? "未作答"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
}
