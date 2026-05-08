import Link from "next/link";
import { Activity, AlertTriangle, ShieldCheck, Clock } from "lucide-react";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="text-center">
        <div className="mb-3 inline-block rounded-full bg-emerald-100 px-4 py-1 text-base font-medium text-emerald-700">
          GoHerb 护肾王 · AI 健康风险筛查
        </div>
        <h1 className="text-balance text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
          5 分钟，看看你的肾还撑得住吗？
        </h1>
        <p className="mt-4 text-balance text-xl leading-relaxed text-slate-600">
          肾病是「沉默杀手」—— 等到发现时通常已经迟了。
          <br />
          回答 30 题，让 AI 帮你看出风险信号。
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <FeatureCard
          icon={<AlertTriangle className="text-amber-500" size={28} />}
          title="尿泡泡多？夜尿频？"
          desc="这些都是肾在求救的信号"
        />
        <FeatureCard
          icon={<Activity className="text-rose-500" size={28} />}
          title="三高 + 重口味"
          desc="马来西亚最常见的伤肾组合"
        />
        <FeatureCard
          icon={<Clock className="text-sky-500" size={28} />}
          title="只需 5 分钟"
          desc="30 题，每题 10 秒就完成"
        />
        <FeatureCard
          icon={<ShieldCheck className="text-emerald-600" size={28} />}
          title="基于权威指南"
          desc="MOH Malaysia / KDIGO / MSN"
        />
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <Link
          href="/register"
          className="inline-flex h-16 items-center justify-center rounded-2xl bg-emerald-600 px-10 text-xl font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
        >
          开始免费筛查 →
        </Link>
        <p className="text-base text-slate-500">资料保密，仅作健康评估用途</p>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2">{icon}</div>
      <div className="text-lg font-semibold text-slate-800">{title}</div>
      <div className="text-base text-slate-500">{desc}</div>
    </div>
  );
}
