"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useHealthStore } from "@/lib/store";
import { RiskGauge } from "@/components/results/RiskGauge";
import { SystemReport } from "@/components/results/SystemReport";
import { GoHerbCTA } from "@/components/results/GoHerbCTA";
import { ComparisonChart } from "@/components/results/ComparisonChart";
import { LightMap } from "@/components/results/LightMap";
import { RiskTimeline } from "@/components/results/RiskTimeline";
import {
  MalaysiaStatsBanner,
  PersonaCard,
  UrgencyFacts,
} from "@/components/results/StatsCards";
import { RotateCcw, Download, Check, Loader2 } from "lucide-react";
import type { SystemKey } from "@/lib/types";

const SYSTEM_META: Record<SystemKey, { title: string; icon: string }> = {
  kidney: { title: "肾脏", icon: "🫘" },
  blood_pressure: { title: "血压", icon: "❤️" },
  blood_sugar: { title: "血糖", icon: "🩸" },
  lipids: { title: "血脂", icon: "🧈" },
};

const overallStyle = {
  low: {
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    bar: "bg-emerald-500",
    label: "整体偏低风险",
    headline: "目前看起来还好 💚",
    subline: "继续保持，定期复查就好",
  },
  medium: {
    bg: "bg-amber-100",
    text: "text-amber-900",
    bar: "bg-amber-500",
    label: "中等风险",
    headline: "你的健康开始亮黄灯 ⚠️",
    subline: "现在是预防的最佳时机，错过就难了",
  },
  high: {
    bg: "bg-rose-100",
    text: "text-rose-900",
    bar: "bg-rose-500",
    label: "高风险",
    headline: "你的身体正在求救 🚨",
    subline: "出现多个明显的风险信号，需要立刻关注",
  },
  unknown: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    bar: "bg-slate-400",
    label: "未评估",
    headline: "结果生成中...",
    subline: "",
  },
};

export default function ResultsPage() {
  const router = useRouter();
  const result = useHealthStore((s) => s.analysisResult);
  const registration = useHealthStore((s) => s.registration);
  const answers = useHealthStore((s) => s.answers);
  const reset = useHealthStore((s) => s.reset);

  const [saving, setSaving] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!result || !registration) router.replace("/");
  }, [result, registration, router]);

  if (!result || !registration) return null;

  const overall = overallStyle[result.overallRisk];

  const handleSavePDF = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/save-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration, answers, result }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "保存失败");
      }
      // Extract filename from Content-Disposition (filename*=UTF-8''...)
      const cd = res.headers.get("Content-Disposition") ?? "";
      const m = cd.match(/filename\*=UTF-8''([^;]+)/i);
      const filename = m ? decodeURIComponent(m[1]) : "GoHerb_报告.pdf";

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloaded(true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Greeting */}
      <p className="text-base text-slate-500">
        {registration.name}，这是你的健康风险报告
      </p>

      {/* Overall summary */}
      <div
        className={`mt-3 rounded-2xl border-2 border-slate-200 ${overall.bg} p-6`}
      >
        <div className={`text-2xl font-bold ${overall.text}`}>
          {overall.headline}
        </div>
        <p className={`mt-1 text-base ${overall.text} opacity-80`}>
          {overall.subline}
        </p>

        <div className="mt-5 flex items-baseline justify-between">
          <div>
            <div className="text-base text-slate-600">整体风险评分</div>
            <div className="mt-1 text-5xl font-bold text-slate-900">
              {result.overallScore}
              <span className="text-2xl font-normal text-slate-500">
                {" "}
                / 100
              </span>
            </div>
          </div>
          <div className={`text-xl font-bold ${overall.text}`}>
            {overall.label}
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/60">
          <div
            className={`h-full ${overall.bar} transition-all`}
            style={{
              width: `${Math.min(100, Math.max(0, result.overallScore))}%`,
            }}
          />
        </div>
      </div>

      {/* Per-system gauges */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(SYSTEM_META) as SystemKey[]).map((k) => {
          const sys = result.systems[k];
          return (
            <RiskGauge
              key={k}
              title={SYSTEM_META[k].title}
              icon={SYSTEM_META[k].icon}
              risk={sys?.risk ?? "unknown"}
            />
          );
        })}
      </div>

      {/* Persona card + Malaysia stats */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <PersonaCard
          result={result}
          age={registration.age}
          gender={registration.gender}
        />
        <MalaysiaStatsBanner />
      </div>

      {/* Comparison chart */}
      <div className="mt-6">
        <ComparisonChart result={result} age={registration.age} />
      </div>

      {/* Light map */}
      <div className="mt-6">
        <LightMap answers={answers} />
      </div>

      {/* Risk timeline */}
      <div className="mt-6">
        <RiskTimeline answers={answers} overallRisk={result.overallRisk} />
      </div>

      {/* Urgency facts */}
      <div className="mt-6">
        <UrgencyFacts />
      </div>

      {/* Top concerns */}
      {result.topConcerns?.length ? (
        <div className="mt-8 rounded-2xl border-2 border-rose-300 bg-rose-50 p-6">
          <h3 className="text-xl font-bold text-rose-900">
            🚨 最需要立刻关注的事
          </h3>
          <ul className="mt-3 space-y-2 text-base text-rose-900">
            {result.topConcerns.map((c, i) => (
              <li key={i} className="flex gap-2 leading-relaxed">
                <span className="font-bold">{i + 1}.</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Per-system detailed reports */}
      <div className="mt-8 space-y-4">
        {(Object.keys(result.systems) as SystemKey[]).map((k) => {
          const sys = result.systems[k];
          if (!sys) return null;
          return <SystemReport key={k} systemKey={k} analysis={sys} />;
        })}
      </div>

      {/* Immediate actions */}
      {result.immediateActions?.length ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-xl font-semibold text-slate-800">
            ✅ 今天就可以做的事
          </h3>
          <ul className="mt-3 space-y-2 text-base text-slate-700">
            {result.immediateActions.map((a, i) => (
              <li key={i} className="flex gap-2 leading-relaxed">
                <span className="text-emerald-600">✓</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.lifestyleAdvice?.length ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-xl font-semibold text-slate-800">
            🌿 长期生活建议
          </h3>
          <ul className="mt-3 space-y-2 text-base text-slate-700">
            {result.lifestyleAdvice.map((a, i) => (
              <li key={i} className="flex gap-2 leading-relaxed">
                <span className="text-sky-600">•</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.followUpAdvice ? (
        <div className="mt-4 rounded-xl bg-sky-50 p-4 text-base text-sky-900">
          📅 复查建议：{result.followUpAdvice}
        </div>
      ) : null}

      {/* GoHerb CTA */}
      <div className="mt-8">
        <GoHerbCTA overallRisk={result.overallRisk} />
      </div>

      {/* Save PDF section */}
      <div className="mt-6 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-6">
        <h3 className="text-xl font-bold text-emerald-900">
          📄 下载报告
        </h3>
        <p className="mt-1 text-base text-emerald-900">
          PDF 报告将下载到你的下载文件夹
        </p>

        {downloaded ? (
          <div className="mt-4 rounded-xl bg-white p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <Check size={20} />
              <span className="font-semibold">已下载！请到下载文件夹查看</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setDownloaded(false);
                handleSavePDF();
              }}
              className="mt-2 text-sm text-emerald-700 underline"
            >
              再下载一份
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSavePDF}
            disabled={saving}
            className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 text-lg font-semibold text-white hover:bg-emerald-800 disabled:bg-slate-400"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                生成 PDF 中...
              </>
            ) : (
              <>
                <Download size={20} />
                保存 PDF 报告
              </>
            )}
          </button>
        )}

        {saveError && (
          <div className="mt-3 rounded-lg bg-rose-100 p-3 text-sm text-rose-800">
            ⚠️ {saveError}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      {result.disclaimer ? (
        <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
          {result.disclaimer}
        </p>
      ) : null}

      {/* Actions */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link
          href="/"
          className="flex min-h-[56px] items-center justify-center rounded-xl border-2 border-slate-300 bg-white text-lg font-medium text-slate-700 hover:border-emerald-500"
        >
          ← 返回首页
        </Link>
        <button
          type="button"
          onClick={() => {
            reset();
            router.push("/");
          }}
          className="flex min-h-[56px] items-center justify-center gap-2 rounded-xl bg-slate-800 text-lg font-medium text-white hover:bg-slate-900"
        >
          <RotateCcw size={18} />
          重新测试
        </button>
      </div>
    </main>
  );
}
