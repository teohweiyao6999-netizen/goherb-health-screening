"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useHealthStore } from "@/lib/store";
import { QUESTIONS, TOTAL_QUESTIONS, getModuleLabel } from "@/lib/questions";
import { cn } from "@/lib/utils";
import { ChevronLeft, Loader2 } from "lucide-react";

const moduleColor: Record<string, string> = {
  kidney: "text-emerald-700 bg-emerald-100",
  blood_pressure: "text-rose-700 bg-rose-100",
  blood_sugar: "text-amber-700 bg-amber-100",
  lifestyle: "text-sky-700 bg-sky-100",
  duration: "text-purple-700 bg-purple-100",
};

const moduleEmoji: Record<string, string> = {
  kidney: "🫘",
  blood_pressure: "❤️",
  blood_sugar: "🩸",
  lifestyle: "🌿",
  duration: "⏰",
};

export default function QuizPage() {
  const router = useRouter();
  const registration = useHealthStore((s) => s.registration);
  const answers = useHealthStore((s) => s.answers);
  const setAnswer = useHealthStore((s) => s.setAnswer);
  const currentIndex = useHealthStore((s) => s.currentQuestionIndex);
  const setCurrentIndex = useHealthStore((s) => s.setCurrentIndex);
  const setAnalysisResult = useHealthStore((s) => s.setAnalysisResult);

  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!registration) router.replace("/register");
  }, [registration, router]);

  if (!registration) return null;

  const i = Math.min(currentIndex, TOTAL_QUESTIONS - 1);
  const q = QUESTIONS[i];
  const currentAnswer = answers[q.id];
  const isLast = i === TOTAL_QUESTIONS - 1;
  const progress = ((i + 1) / TOTAL_QUESTIONS) * 100;

  const handleSelect = (option: { label: string; value: string; score: number }) => {
    setAnswer(q.id, {
      question: q.text,
      answer: option.label,
      score: option.score,
    });
  };

  const handleNext = () => {
    if (!currentAnswer) return;
    if (!isLast) {
      setCurrentIndex(i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleAnalyze();
    }
  };

  const handleBack = () => {
    if (i > 0) {
      setCurrentIndex(i - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/register");
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration, answers }),
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

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      {/* Progress */}
      <div className="sticky top-0 z-10 -mx-4 bg-gradient-to-b from-emerald-50/80 to-emerald-50/40 px-4 pb-4 pt-2 backdrop-blur">
        <div className="mb-2 flex items-baseline justify-between">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              moduleColor[q.module]
            )}
          >
            {moduleEmoji[q.module]} {getModuleLabel(q.module)}
          </span>
          <span className="text-base font-semibold text-slate-700">
            第 {i + 1} / {TOTAL_QUESTIONS} 题
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/80">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mt-6 rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold leading-relaxed text-slate-800">
          {q.text}
        </h2>
        <div className="mt-6 grid gap-3">
          {q.options?.map((opt) => {
            const selected = currentAnswer?.answer === opt.label;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt)}
                className={cn(
                  "min-h-[60px] rounded-xl border-2 px-5 py-3 text-left text-lg leading-relaxed transition",
                  selected
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border-2 border-rose-300 bg-rose-50 p-4 text-rose-800">
          ⚠️ {error}
          <br />
          <button
            type="button"
            onClick={handleAnalyze}
            className="mt-2 underline"
          >
            再试一次
          </button>
        </div>
      )}

      {/* Nav */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex min-h-[56px] items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white text-lg font-medium text-slate-700 hover:border-slate-400"
        >
          <ChevronLeft size={20} />
          上一题
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!currentAnswer}
          className={cn(
            "flex min-h-[56px] items-center justify-center rounded-xl text-lg font-semibold text-white transition",
            currentAnswer
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-slate-300"
          )}
        >
          {isLast ? "完成，查看结果 →" : "下一题 →"}
        </button>
      </div>
    </main>
  );
}
