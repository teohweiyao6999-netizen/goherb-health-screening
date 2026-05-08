"use client";

import { MY_STATS, URGENCY_FACTS, getMalaysiaAverageScore } from "@/lib/malaysia-stats";
import type { AnalysisResult } from "@/lib/types";

interface Props {
  result: AnalysisResult;
  age: number;
  gender: "male" | "female";
}

export function MalaysiaStatsBanner() {
  return (
    <div className="rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-amber-50 p-5">
      <div className="text-base font-bold text-rose-900">
        📍 你正在马来西亚的「沉默杀手」名单上
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <StatTile
          icon="🫘"
          big={MY_STATS.ckd.ratio}
          label="马来西亚成年人有 CKD（慢性肾病）"
          source={MY_STATS.ckd.source}
        />
        <StatTile
          icon="🩸"
          big={MY_STATS.diabetes.ratio}
          label="有糖尿病"
          source={MY_STATS.diabetes.source}
        />
        <StatTile
          icon="❤️"
          big={MY_STATS.hypertension.ratio}
          label="有高血压"
          source={MY_STATS.hypertension.source}
        />
        <StatTile
          icon="🧈"
          big={MY_STATS.cholesterol.ratio}
          label="有高胆固醇"
          source={MY_STATS.cholesterol.source}
        />
      </div>
    </div>
  );
}

function StatTile({
  icon,
  big,
  label,
  source,
}: {
  icon: string;
  big: string;
  label: string;
  source: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="text-lg font-bold leading-tight text-rose-700">
            {big}
          </div>
          <div className="text-sm text-slate-700">{label}</div>
        </div>
      </div>
      <div className="mt-2 text-[10px] text-slate-400">来源：{source}</div>
    </div>
  );
}

export function PersonaCard({ result, age, gender }: Props) {
  const avg = getMalaysiaAverageScore(age);
  const diff = result.overallScore - avg.overall;

  return (
    <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-5">
      <div className="text-base font-bold text-slate-800">
        👤 你的健康画像
      </div>
      <div className="mt-3 space-y-2 text-base text-slate-700">
        <div>
          • {age} 岁{gender === "male" ? "男性" : "女性"} 马来西亚成人
        </div>
        <div>
          • 同年龄段平均风险评分：
          <span className="font-bold text-slate-900">{avg.overall} / 100</span>
        </div>
        <div>
          • 你的评分：
          <span
            className={`font-bold ${
              result.overallScore > avg.overall + 10
                ? "text-rose-700"
                : result.overallScore > avg.overall
                  ? "text-amber-700"
                  : "text-emerald-700"
            }`}
          >
            {result.overallScore} / 100
          </span>
        </div>
        <div className="mt-2 rounded-lg bg-white p-3">
          {diff > 15 ? (
            <span className="text-rose-700">
              ⚠️ 你的风险比同龄人高出 <strong>{diff} 分</strong>，超出正常范围
            </span>
          ) : diff > 0 ? (
            <span className="text-amber-700">
              ⚠️ 你的风险略高于同龄平均（高 {diff} 分）
            </span>
          ) : (
            <span className="text-emerald-700">
              ✓ 你的风险低于同龄平均（低 {Math.abs(diff)} 分），继续保持
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function UrgencyFacts() {
  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
      <div className="text-base font-bold text-amber-900">
        💡 你应该知道的事实
      </div>
      <div className="mt-3 space-y-2">
        {URGENCY_FACTS.map((f, i) => (
          <div key={i} className="rounded-lg bg-white p-3">
            <div className="text-base text-slate-800">
              <span className="mr-2 text-xl">{f.icon}</span>
              {f.fact}
            </div>
            <div className="mt-1 text-[10px] text-slate-400">来源：{f.source}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
