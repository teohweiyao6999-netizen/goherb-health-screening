import type { SymptomAnswer, RiskLevel } from "./types";
import { QUESTIONS } from "./questions";

// ════════════════════════════════════════════════════════════════
// Answer Insights — 固定规则把「顾客的答案」连到「风险结论」
//
// 这一层不调 AI，纯计算。保证连线结论稳定、可被销售背诵。
// ════════════════════════════════════════════════════════════════

export type InsightModule = "kidney" | "blood_pressure" | "blood_sugar" | "lifestyle";

export interface ModuleScore {
  module: InsightModule;
  total: number;
  max: number;
  pct: number; // 0-100
  risk: RiskLevel;
}

export interface FlaggedAnswer {
  questionId: string;
  questionText: string;
  shortText: string; // 简短版题目，给连线区用
  userAnswer: string;
  score: number;
}

// 把长题目缩成一句关键词（给「为什么」区用）
const SHORT_TEXT: Record<string, string> = {
  // 肾脏
  kidney_foam: "尿液泡泡多、久久不散",
  kidney_nocturia: "半夜频繁起来小便",
  kidney_urine_color: "尿液颜色偏深 / 异常",
  kidney_urine_smell: "尿液有腥味 / 异味",
  kidney_eye_swell: "早上眼皮 / 脸部浮肿",
  kidney_leg_swell: "脚踝 / 小腿水肿、按了凹陷",
  kidney_back_pain: "腰部两侧酸胀",
  kidney_skin_itch: "皮肤无故痕痒",
  kidney_fatigue: "整体疲累、没精神",
  kidney_medication: "长期吃止痛药 / 西药",
  kidney_taste: "重口味、爱配辣椒酱 / 酱油",
  kidney_water: "喝水量偏少",
  kidney_family: "家族有肾病 / 洗肾史",
  // 血压
  bp_known: "血压数值偏高",
  bp_diagnosed: "曾被诊断高血压 / 在吃降压药",
  bp_headache: "经常后脑头痛",
  bp_dizzy: "头晕、眼前发黑",
  bp_chest: "胸口闷、心跳快",
  bp_neck: "颈部、肩膀僵硬酸痛",
  // 血糖
  sugar_known: "空腹血糖偏高",
  sugar_diagnosed: "曾被诊断糖尿病 / 前期糖尿病",
  sugar_thirst: "经常口渴、喝不停",
  sugar_urine_freq: "白天频繁跑厕所",
  sugar_wound: "伤口愈合缓慢",
  sugar_weight: "体重无故下降",
  // 生活习惯
  life_smoking: "有抽烟习惯",
  life_alcohol: "有喝酒习惯",
  life_exercise: "运动量不足",
  life_sleep: "睡眠不足 / 品质差",
  life_stress: "压力偏大",
};

export function shortQuestionText(questionId: string, fallback: string): string {
  return SHORT_TEXT[questionId] ?? fallback;
}

// 固定规则：百分比 → 风险等级
export function riskFromPct(pct: number): RiskLevel {
  if (pct >= 55) return "high";
  if (pct >= 30) return "medium";
  return "low";
}

export function getModuleScore(
  answers: Record<string, SymptomAnswer>,
  module: InsightModule
): ModuleScore {
  const qs = QUESTIONS.filter((q) => q.module === module);
  let total = 0;
  let max = 0;
  for (const q of qs) {
    const a = answers[q.id];
    if (a) total += a.score;
    max += 3;
  }
  const pct = max > 0 ? Math.round((total / max) * 100) : 0;
  return { module, total, max, pct, risk: riskFromPct(pct) };
}

// 返回该模块的红灯题（score >= 2）
export function getRedFlags(
  answers: Record<string, SymptomAnswer>,
  module: InsightModule
): FlaggedAnswer[] {
  const qs = QUESTIONS.filter((q) => q.module === module);
  const flags: FlaggedAnswer[] = [];
  for (const q of qs) {
    const a = answers[q.id];
    if (a && a.score >= 2) {
      flags.push({
        questionId: q.id,
        questionText: q.text,
        shortText: shortQuestionText(q.id, q.text),
        userAnswer: a.answer,
        score: a.score,
      });
    }
  }
  // 高分排前面
  return flags.sort((a, b) => b.score - a.score);
}

// 返回该模块「答得好」的题（score === 0），给低风险绿色版用
export function getGreenAnswers(
  answers: Record<string, SymptomAnswer>,
  module: InsightModule
): FlaggedAnswer[] {
  const qs = QUESTIONS.filter((q) => q.module === module);
  const greens: FlaggedAnswer[] = [];
  for (const q of qs) {
    const a = answers[q.id];
    if (a && a.score === 0) {
      greens.push({
        questionId: q.id,
        questionText: q.text,
        shortText: shortQuestionText(q.id, q.text),
        userAnswer: a.answer,
        score: a.score,
      });
    }
  }
  return greens;
}

// 全模块红灯总数（给报告头摘要用）
export function totalRedFlags(answers: Record<string, SymptomAnswer>): number {
  return QUESTIONS.filter((q) => {
    if (q.module === "duration") return false;
    return (answers[q.id]?.score ?? 0) >= 2;
  }).length;
}
