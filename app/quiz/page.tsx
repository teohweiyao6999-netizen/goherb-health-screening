"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useHealthStore } from "@/lib/store";
import { QUESTIONS, getModuleLabel } from "@/lib/questions";
import {
  LAB_FIELDS,
  LAB_SECTIONS,
  computeEGFR,
  hasAnyLabValue,
  summarizeLabs,
  type LabFieldKey,
} from "@/lib/lab-values";
import { cn } from "@/lib/utils";
import { ChevronLeft, Loader2, FlaskConical } from "lucide-react";

const moduleColor: Record<string, string> = {
  kidney: "border-emerald-300 bg-emerald-50/40",
  blood_pressure: "border-rose-300 bg-rose-50/40",
  blood_sugar: "border-amber-300 bg-amber-50/40",
  lifestyle: "border-sky-300 bg-sky-50/40",
  duration: "border-purple-300 bg-purple-50/40",
};

const moduleHeader: Record<string, string> = {
  kidney: "bg-emerald-100 text-emerald-800",
  blood_pressure: "bg-rose-100 text-rose-800",
  blood_sugar: "bg-amber-100 text-amber-800",
  lifestyle: "bg-sky-100 text-sky-800",
  duration: "bg-purple-100 text-purple-800",
};

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

export default function QuizPage() {
  const router = useRouter();
  const registration = useHealthStore((s) => s.registration);
  const answers = useHealthStore((s) => s.answers);
  const setAnswer = useHealthStore((s) => s.setAnswer);
  const labValues = useHealthStore((s) => s.labValues);
  const setLabValue = useHealthStore((s) => s.setLabValue);
  const setAnalysisResult = useHealthStore((s) => s.setAnalysisResult);

  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (!registration) router.replace("/register");
  }, [registration, router]);

  // Group questions by module
  const grouped = useMemo(() => {
    const out: Record<string, typeof QUESTIONS> = {};
    for (const q of QUESTIONS) {
      if (!out[q.module]) out[q.module] = [];
      out[q.module].push(q);
    }
    return out;
  }, []);

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = QUESTIONS.length;
  const allAnswered = answeredCount >= totalQuestions;

  // eGFR preview
  const egfr = useMemo(() => {
    if (!registration) return null;
    return computeEGFR(labValues, registration.age, registration.gender);
  }, [labValues, registration]);

  if (!registration) return null;

  const handleSelect = (
    questionId: string,
    questionText: string,
    option: { label: string; value: string; score: number }
  ) => {
    setAnswer(questionId, {
      question: questionText,
      answer: option.label,
      score: option.score,
    });
  };

  const handleLabChange = (key: LabFieldKey, raw: string) => {
    if (raw === "") {
      setLabValue(key, undefined);
    } else {
      const num = parseFloat(raw);
      setLabValue(key, Number.isNaN(num) ? undefined : num);
    }
  };

  const handleSubmit = async () => {
    if (!allAnswered) {
      setShowValidation(true);
      // scroll to first unanswered question
      const firstUnanswered = QUESTIONS.find((q) => !answers[q.id]);
      if (firstUnanswered) {
        const el = document.getElementById(`q-${firstUnanswered.id}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration, answers, labValues }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "分析失败");
      }
      const result = await res.json();
      setAnalysisResult(result);
      router.push("/results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
      setAnalyzing(false);
    }
  };

  if (analyzing) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
        <Loader2 className="animate-spin text-emerald-600" size={64} />
        <h2 className="mt-6 text-2xl font-semibold text-slate-800">
          AI 正在仔细分析你的答案...
        </h2>
        <p className="mt-2 text-lg text-slate-600">
          {registration.name}，等一下下，大概 20–30 秒
        </p>
      </main>
    );
  }

  const labSummary = summarizeLabs(labValues, registration.gender);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      {/* Top bar */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <ChevronLeft size={16} /> 返回
          </button>
          <div className="text-sm text-slate-600">
            <span
              className={cn(
                "font-semibold",
                allAnswered ? "text-emerald-600" : "text-amber-600"
              )}
            >
              已答 {answeredCount}/{totalQuestions}
            </span>
            {hasAnyLabValue(labValues) && (
              <span className="ml-2 text-emerald-600">
                · 已填 {labSummary.length} 项体检数值
              </span>
            )}
          </div>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* ─── Lab Values Panel ─── */}
      <section className="mt-6 rounded-2xl border-2 border-sky-300 bg-sky-50/60 p-5">
        <div className="flex items-center gap-2">
          <FlaskConical className="text-sky-700" size={22} />
          <h2 className="text-lg font-bold text-slate-800">
            体检数值（可选填）
          </h2>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          有体检报告就填进来，分析会更精准。没有报告可以全部空着，跳过这区。
        </p>

        <div className="mt-4 space-y-4">
          {LAB_SECTIONS.map((sec) => {
            const fields = LAB_FIELDS.filter((f) => f.section === sec.key);
            return (
              <div key={sec.key} className="rounded-xl bg-white p-4">
                <div className="mb-2 text-sm font-semibold text-slate-700">
                  {sec.icon} {sec.title}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {fields.map((f) => {
                    const v = labValues[f.key];
                    return (
                      <label key={f.key} className="block">
                        <div className="mb-1 text-sm text-slate-700">
                          {f.label}{" "}
                          <span className="text-xs text-slate-400">
                            ({f.unit})
                          </span>
                        </div>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          value={v ?? ""}
                          onChange={(e) =>
                            handleLabChange(f.key, e.target.value)
                          }
                          placeholder={f.placeholder}
                          className="h-11 w-full rounded-lg border-2 border-slate-200 px-3 text-base focus:border-sky-500 focus:outline-none"
                        />
                        <div className="mt-0.5 text-[11px] text-slate-400">
                          正常：{f.normal}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {egfr && (
            <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4">
              <div className="text-sm font-semibold text-emerald-900">
                🧮 自动计算 eGFR
              </div>
              <div className="mt-1 text-2xl font-bold text-emerald-900">
                {egfr.egfr}{" "}
                <span className="text-sm font-normal text-emerald-700">
                  mL/min/1.73m²
                </span>
              </div>
              <div className="mt-1 text-sm text-emerald-800">
                CKD 分期：<span className="font-semibold">{egfr.label}</span>
              </div>
              <div className="mt-0.5 text-[11px] text-emerald-700">
                公式：CKD-EPI 2021（race-free）· KDIGO 2024 标准
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Symptom Questions (single page, grouped) ─── */}
      <section className="mt-6">
        <h2 className="mb-3 text-lg font-bold text-slate-800">
          症状问卷（{totalQuestions} 题）
        </h2>

        <div className="space-y-6">
          {moduleOrder.map((mod) => {
            const qs = grouped[mod];
            if (!qs?.length) return null;
            return (
              <div key={mod}>
                <div
                  className={cn(
                    "sticky top-20 z-10 mb-3 inline-block rounded-full px-3 py-1 text-sm font-semibold",
                    moduleHeader[mod]
                  )}
                >
                  {moduleEmoji[mod]} {getModuleLabel(mod)}（{qs.length} 题）
                </div>
                <div className="space-y-3">
                  {qs.map((q, qi) => {
                    const ans = answers[q.id];
                    const unanswered = !ans && showValidation;
                    return (
                      <div
                        key={q.id}
                        id={`q-${q.id}`}
                        className={cn(
                          "rounded-2xl border-2 bg-white p-5 transition",
                          unanswered
                            ? "border-rose-400 ring-2 ring-rose-200"
                            : moduleColor[mod]
                        )}
                      >
                        <h3 className="text-base font-medium leading-relaxed text-slate-800">
                          <span className="mr-2 text-slate-400">{qi + 1}.</span>
                          {q.text}
                          {unanswered && (
                            <span className="ml-2 text-sm text-rose-600">
                              · 未答
                            </span>
                          )}
                        </h3>
                        <div className="mt-3 grid gap-2">
                          {q.options?.map((opt) => {
                            const selected = ans?.answer === opt.label;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleSelect(q.id, q.text, opt)}
                                className={cn(
                                  "min-h-[44px] rounded-lg border-2 px-3 py-2 text-left text-sm transition",
                                  selected
                                    ? "border-emerald-500 bg-emerald-100 font-semibold text-emerald-900"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40"
                                )}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {error && (
        <div className="mt-6 rounded-xl border-2 border-rose-300 bg-rose-50 p-4 text-rose-800">
          ⚠️ {error}
          <br />
          <button
            type="button"
            onClick={handleSubmit}
            className="mt-2 underline"
          >
            再试一次
          </button>
        </div>
      )}

      {/* Submit */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={handleSubmit}
          className={cn(
            "flex h-14 w-full items-center justify-center rounded-xl text-lg font-bold text-white shadow-lg transition",
            allAnswered
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-amber-500 hover:bg-amber-600"
          )}
        >
          {allAnswered
            ? "✓ 完成，查看 AI 分析结果 →"
            : `还有 ${totalQuestions - answeredCount} 题未答 — 点这里查看`}
        </button>
      </div>
    </main>
  );
}
