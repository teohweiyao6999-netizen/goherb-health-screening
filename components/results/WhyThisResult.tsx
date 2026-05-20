"use client";

import type { AnalysisResult, SymptomAnswer, SystemKey } from "@/lib/types";
import {
  getModuleScore,
  getRedFlags,
  getGreenAnswers,
  type InsightModule,
} from "@/lib/answer-insights";
import { cn } from "@/lib/utils";

interface Props {
  result: AnalysisResult;
  answers: Record<string, SymptomAnswer>;
}

const MODULE_META: { key: InsightModule; sys: SystemKey; title: string; icon: string }[] = [
  { key: "kidney", sys: "kidney", title: "肾脏", icon: "🫘" },
  { key: "blood_pressure", sys: "blood_pressure", title: "血压", icon: "❤️" },
  { key: "blood_sugar", sys: "blood_sugar", title: "血糖", icon: "🩸" },
];

const riskLabel = { low: "低风险", medium: "中风险", high: "高风险", unknown: "未评估" };

const blockStyle = {
  high: "border-rose-300 bg-rose-50",
  medium: "border-amber-300 bg-amber-50",
  low: "border-emerald-300 bg-emerald-50",
  unknown: "border-slate-200 bg-slate-50",
};

const badgeStyle = {
  high: "bg-rose-600 text-white",
  medium: "bg-amber-500 text-white",
  low: "bg-emerald-600 text-white",
  unknown: "bg-slate-400 text-white",
};

const chipStyle = {
  high: "bg-white border-rose-200 text-rose-900",
  medium: "bg-white border-amber-200 text-amber-900",
  low: "bg-white border-emerald-200 text-emerald-900",
  unknown: "bg-white border-slate-200 text-slate-800",
};

export function WhyThisResult({ result, answers }: Props) {
  return (
    <div className="space-y-4">
      {MODULE_META.map(({ key, sys, title, icon }) => {
        const score = getModuleScore(answers, key);
        const sysAnalysis = result.systems[sys];
        // Trust the AI risk if present, else fall back to rule-based
        const risk = sysAnalysis?.risk ?? score.risk;
        const redFlags = getRedFlags(answers, key);
        const greens = getGreenAnswers(answers, key);
        const isGood = risk === "low";

        return (
          <div
            key={key}
            className={cn("rounded-2xl border-2 p-5", blockStyle[risk])}
          >
            {/* Header */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">{icon}</span>
              <h4 className="text-lg font-bold text-slate-800">
                为什么你的{title}是
                <span
                  className={cn(
                    "mx-1 rounded-md px-2 py-0.5 text-base",
                    badgeStyle[risk]
                  )}
                >
                  {riskLabel[risk]}
                </span>
                ？
              </h4>
            </div>

            {/* Linked answers */}
            <div className="mt-3">
              <div className="text-sm font-medium text-slate-600">
                {isGood ? "因为你这几题答得不错：" : "因为你刚才回答了："}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(isGood ? greens : redFlags).slice(0, 6).map((f) => (
                  <span
                    key={f.questionId}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-sm",
                      chipStyle[risk]
                    )}
                  >
                    {f.shortText}
                    <span className="ml-1 font-semibold">
                      → {f.userAnswer}
                    </span>
                  </span>
                ))}
                {!isGood && redFlags.length === 0 && (
                  <span className="text-sm text-slate-500">
                    没有明显的高风险信号
                  </span>
                )}
                {isGood && greens.length === 0 && (
                  <span className="text-sm text-slate-500">
                    （详情见下方完整答案）
                  </span>
                )}
              </div>
            </div>

            {/* Arrow + conclusion */}
            <div className="mt-3 flex flex-col items-center">
              <div className="text-2xl leading-none text-slate-400">↓</div>
              <div
                className={cn(
                  "mt-1 w-full rounded-xl border-l-4 p-4",
                  risk === "high"
                    ? "border-rose-500 bg-white"
                    : risk === "medium"
                      ? "border-amber-500 bg-white"
                      : "border-emerald-500 bg-white"
                )}
              >
                <p className="text-base font-medium leading-relaxed text-slate-800">
                  {sysAnalysis?.causeEffect ??
                    (isGood
                      ? `你的${title}目前没有明显风险信号，继续保持。`
                      : `这几个信号合起来，代表你的${title}需要多加注意。`)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
