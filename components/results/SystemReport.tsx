"use client";

import type { SystemAnalysis, SystemKey } from "@/lib/types";
import { getCitation } from "@/lib/citations";
import { cn } from "@/lib/utils";

const titleMap: Record<SystemKey, { title: string; icon: string }> = {
  kidney: { title: "肾脏健康", icon: "🫘" },
  blood_pressure: { title: "血压系统", icon: "❤️" },
  blood_sugar: { title: "血糖系统", icon: "🩸" },
  lipids: { title: "血脂系统", icon: "🧈" },
};

const riskBadge = {
  low: "bg-emerald-100 text-emerald-800 border-emerald-300",
  medium: "bg-amber-100 text-amber-800 border-amber-300",
  high: "bg-rose-100 text-rose-800 border-rose-300",
  unknown: "bg-slate-100 text-slate-700 border-slate-300",
};

const cardBorder = {
  low: "border-emerald-200",
  medium: "border-amber-300",
  high: "border-rose-400",
  unknown: "border-slate-200",
};

const metaphorBg = {
  low: "border-emerald-300 bg-emerald-50/60",
  medium: "border-amber-400 bg-amber-50",
  high: "border-rose-500 bg-rose-50",
  unknown: "border-slate-300 bg-slate-50",
};

const highlightBg = {
  low: "bg-emerald-100 text-emerald-900",
  medium: "bg-amber-100 text-amber-900",
  high: "bg-rose-100 text-rose-900",
  unknown: "bg-slate-100 text-slate-900",
};

const riskLabel = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
  unknown: "未评估",
};

// Render text with **bold** markers as highlighted spans
function renderHighlighted(text: string, risk: keyof typeof highlightBg) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <mark
          key={i}
          className={cn(
            "rounded px-1 py-0.5 font-semibold",
            highlightBg[risk]
          )}
        >
          {part.slice(2, -2)}
        </mark>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function SystemReport({
  systemKey,
  analysis,
}: {
  systemKey: SystemKey;
  analysis: SystemAnalysis;
}) {
  const meta = titleMap[systemKey];
  const citation = analysis.citationKey ? getCitation(analysis.citationKey) : null;

  return (
    <div className={cn("rounded-2xl border-2 bg-white p-6", cardBorder[analysis.risk])}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-2xl font-semibold text-slate-800">
          <span>{meta.icon}</span>
          {meta.title}
        </h3>
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-base font-medium",
            riskBadge[analysis.risk]
          )}
        >
          {riskLabel[analysis.risk]}
        </span>
      </div>

      {/* Visual metaphor */}
      {analysis.visualMetaphor ? (
        <div
          className={cn(
            "mt-4 rounded-xl border-l-4 p-4 italic",
            metaphorBg[analysis.risk]
          )}
        >
          <p className="text-lg leading-relaxed text-slate-800">
            💭 {analysis.visualMetaphor}
          </p>
        </div>
      ) : null}

      {/* Paragraph with bold highlights */}
      {analysis.paragraph ? (
        <p className="mt-4 text-lg leading-relaxed text-slate-800">
          {renderHighlighted(analysis.paragraph, analysis.risk)}
        </p>
      ) : null}

      {/* Recommendation */}
      {analysis.recommendation ? (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <div className="text-base font-semibold text-slate-800">
            👉 建议
          </div>
          <p className="mt-1 text-base leading-relaxed text-slate-700">
            {analysis.recommendation}
          </p>
        </div>
      ) : null}

      {/* Full citation */}
      {citation ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            📖 科学依据
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">
            {citation.full}
          </p>
          {citation.url ? (
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block break-all text-xs text-emerald-700 underline hover:text-emerald-900"
            >
              {citation.url}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
