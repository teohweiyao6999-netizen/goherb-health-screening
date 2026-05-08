"use client";

import { MessageCircle, ExternalLink } from "lucide-react";
import type { RiskLevel } from "@/lib/types";

interface CTAConfig {
  title: string;
  message: string;
  type: "urgent" | "preventive" | "maintenance";
  bg: string;
  border: string;
}

const config: Record<RiskLevel, CTAConfig> = {
  high: {
    title: "你的肾，已经在求救 ⚠️",
    message:
      "你的答案显示出多个肾脏受损信号。再拖下去，等到 eGFR 数值下降，恢复就难了。建议马上联系我们的专业顾问，了解护肾王怎么帮你。",
    type: "urgent",
    bg: "bg-rose-50",
    border: "border-rose-300",
  },
  medium: {
    title: "你的肾正在悄悄受伤",
    message:
      "好消息是：现在还来得及保护它。中风险阶段就是最关键的预防时机 — 千万不要等到症状变明显才行动。",
    type: "preventive",
    bg: "bg-amber-50",
    border: "border-amber-300",
  },
  low: {
    title: "目前看起来还好 💚",
    message:
      "你目前的风险信号不多，但肾病是「沉默的」 — 建议继续保持好习惯，定期复查。",
    type: "maintenance",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  unknown: {
    title: "了解 GoHerb 护肾王",
    message: "了解我们的肾脏保健配方，守护全家健康。",
    type: "preventive",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
};

export function GoHerbCTA({ overallRisk }: { overallRisk: RiskLevel }) {
  const c = config[overallRisk];
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "60123456789";
  const productUrl =
    process.env.NEXT_PUBLIC_GOHERB_PRODUCT_URL ?? "https://goherb.com.my";
  const waUrl = `https://wa.me/${wa}?text=${encodeURIComponent(
    "你好，我刚完成 GoHerb 健康风险筛查，想咨询关于护肾王的资讯。"
  )}`;

  const primaryIsWa = c.type === "urgent";

  return (
    <div className={`rounded-2xl border-2 ${c.border} ${c.bg} p-6`}>
      <h3 className="text-2xl font-bold text-slate-900">{c.title}</h3>
      <p className="mt-2 text-lg leading-relaxed text-slate-700">{c.message}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <a
          href={primaryIsWa ? waUrl : productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[60px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-lg font-semibold text-white shadow hover:bg-emerald-700"
        >
          {primaryIsWa ? (
            <>
              <MessageCircle size={22} />
              马上咨询健康顾问
            </>
          ) : (
            <>
              了解护肾王配方
              <ExternalLink size={18} />
            </>
          )}
        </a>
        <a
          href={primaryIsWa ? productUrl : waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[60px] items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 bg-white px-5 text-lg font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          {primaryIsWa ? (
            <>
              了解护肾王
              <ExternalLink size={18} />
            </>
          ) : (
            <>
              <MessageCircle size={22} />
              联系健康顾问
            </>
          )}
        </a>
      </div>
    </div>
  );
}
