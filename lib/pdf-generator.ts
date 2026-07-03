import PDFDocument from "pdfkit";
import path from "path";
import type { Registration, AnalysisResult, SymptomAnswer, SystemKey } from "./types";
import { MY_STATS } from "./malaysia-stats";
import { getCitation } from "./citations";
import { getRedFlags, type InsightModule } from "./answer-insights";
import {
  type LabValues,
  summarizeLabs,
  computeEGFR,
  hasAnyLabValue,
} from "./lab-values";

function makeReportNumber(name: string, phone: string, iso: string): string {
  const d = new Date(iso);
  const pad = (x: number) => x.toString().padStart(2, "0");
  const datePart = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  let hash = 0;
  const seed = name + phone + iso;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffff;
  }
  return `GH-${datePart}-${hash.toString().padStart(4, "0").slice(-4)}`;
}

const FONT_REG = path.join(process.cwd(), "lib/fonts/NotoSansSC-Regular.otf");
const FONT_BOLD = path.join(process.cwd(), "lib/fonts/NotoSansSC-Bold.otf");

const SYSTEM_TITLES: Record<SystemKey, string> = {
  kidney: "肾脏",
  blood_pressure: "血压",
  blood_sugar: "血糖",
  lipids: "血脂",
};

const RISK_LABEL = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
  unknown: "—",
};

const RISK_COLOR = {
  low: "#059669",
  medium: "#d97706",
  high: "#dc2626",
  unknown: "#94a3b8",
};

const RISK_BG = {
  low: "#ecfdf5",
  medium: "#fffbeb",
  high: "#fef2f2",
  unknown: "#f8fafc",
};

interface BuildPdfArgs {
  registration: Registration;
  answers: Record<string, SymptomAnswer>;
  result: AnalysisResult;
  labValues?: LabValues;
}

export function buildPdfBuffer(args: BuildPdfArgs): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 28, // tighter margin for 1-page
      info: {
        Title: `GoHerb 健康风险报告 - ${args.registration.name}`,
        Author: "GoHerb 护肾王",
      },
    });

    doc.registerFont("zh", FONT_REG);
    doc.registerFont("zh-bold", FONT_BOLD);
    doc.font("zh");

    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    renderPdf(doc, args);
    doc.end();
  });
}

// ════════════════════════════════════════════════════════════════
// SINGLE-PAGE A4 LAYOUT
// ════════════════════════════════════════════════════════════════
//
// Layout:
// ┌─────────────────────────────────────────────────────────┐
// │ [Brand Bar]  GoHerb 健康风险评估报告                     │
// │                                                          │
// │ Header: 姓名/编号/日期   |   整体评分大圆环  +  风险条    │
// │                                                          │
// │ 3 系统 mini gauge: [肾] [血压] [血糖]                    │
// │                                                          │
// │ ┌── 左栏 ────────────┐  ┌── 右栏 ─────────────┐         │
// │ │ 为什么是这个结果?    │  │ 体检数值 + eGFR     │         │
// │ │ ▸ 关键发现 3-5 条   │  │ (或马来西亚数据)     │         │
// │ └────────────────────┘  └─────────────────────┘         │
// │                                                          │
// │ 该怎么办? 3 条具体行动                                    │
// │                                                          │
// │ 4 条马来西亚关键数据 (mini stats bar)                     │
// │                                                          │
// │ Footer: WhatsApp + Citation + Disclaimer                 │
// └─────────────────────────────────────────────────────────┘

const PAGE_W = 595;
const MARGIN = 28;
const CONTENT_W = PAGE_W - 2 * MARGIN; // 539
const COL_GAP = 12;
const COL_W = (CONTENT_W - COL_GAP) / 2; // 263.5

function renderPdf(doc: PDFKit.PDFDocument, args: BuildPdfArgs) {
  const { registration, result, labValues } = args;

  // ─── 1. Brand bar (top green strip) ────────────────────────────
  doc.rect(0, 0, PAGE_W, 8).fill("#059669");
  doc.rect(0, 8, PAGE_W, 4).fill("#10b981");

  // ─── 2. Title row ──────────────────────────────────────────────
  let y = 20;
  doc
    .font("zh-bold")
    .fontSize(16)
    .fillColor("#065f46")
    .text("GoHerb 健康风险评估报告", MARGIN, y, { width: CONTENT_W });
  doc
    .font("zh")
    .fontSize(7.5)
    .fillColor("#64748b")
    .text(
      "AI 健康风险筛查 · 仅供参考，不构成医疗诊断",
      MARGIN,
      y + 20,
      { width: CONTENT_W }
    );

  // ─── 3. Header info + overall score (2-col) ────────────────────
  y = 50;
  const reportNo = makeReportNumber(
    registration.name,
    registration.phone,
    registration.registeredAt
  );
  const reportDate = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  // Left: client info
  doc.font("zh-bold").fontSize(8).fillColor("#475569");
  doc.text("客户资料", MARGIN, y);
  doc.font("zh").fontSize(9).fillColor("#0f172a");
  doc.text(`姓名：${registration.name}`, MARGIN, y + 12);
  doc.text(
    `${registration.age}岁 · ${registration.gender === "male" ? "男" : "女"} · ${registration.phone}`,
    MARGIN,
    y + 25
  );
  doc.font("zh").fontSize(8).fillColor("#64748b");
  doc.text(`报告编号：${reportNo}`, MARGIN, y + 38);
  doc.text(`日期：${reportDate}`, MARGIN, y + 49);

  // Right: overall score circle + bar
  const overallColor = RISK_COLOR[result.overallRisk] ?? "#94a3b8";
  const overallBg = RISK_BG[result.overallRisk] ?? "#f8fafc";

  const rightX = MARGIN + COL_W + COL_GAP;
  // background card
  doc
    .roundedRect(rightX, y - 6, COL_W, 68, 6)
    .fillColor(overallBg)
    .fill();
  // Circle gauge
  drawRingGauge(
    doc,
    rightX + 35,
    y + 28,
    24,
    result.overallScore,
    100,
    overallColor
  );
  doc.font("zh-bold").fontSize(14).fillColor(overallColor);
  const scoreText = `${result.overallScore}`;
  const scoreW = doc.widthOfString(scoreText);
  doc.text(scoreText, rightX + 35 - scoreW / 2, y + 22);
  doc.font("zh").fontSize(6).fillColor("#64748b");
  const small = "/100";
  const smallW = doc.widthOfString(small);
  doc.text(small, rightX + 35 - smallW / 2, y + 38);

  // Label + risk
  doc.font("zh-bold").fontSize(10).fillColor(overallColor);
  doc.text("整体风险评分", rightX + 72, y);
  doc.font("zh-bold").fontSize(14).fillColor(overallColor);
  doc.text(RISK_LABEL[result.overallRisk], rightX + 72, y + 14);
  // Risk progress bar
  const barX = rightX + 72;
  const barW = COL_W - 80;
  const barY = y + 38;
  doc.roundedRect(barX, barY, barW, 6, 3).fillColor("#e2e8f0").fill();
  const fillPct = Math.max(
    0,
    Math.min(1, result.overallScore / 100)
  );
  doc
    .roundedRect(barX, barY, barW * fillPct, 6, 3)
    .fillColor(overallColor)
    .fill();
  doc.font("zh").fontSize(6.5).fillColor("#64748b");
  doc.text("低 0 — 100 高", barX, barY + 9);

  // ─── 4. 3 system mini gauges ───────────────────────────────────
  y = 130;
  const systemKeys: SystemKey[] = ["kidney", "blood_pressure", "blood_sugar"];
  const gaugeW = CONTENT_W / 3 - 6;

  systemKeys.forEach((k, i) => {
    const sys = result.systems[k];
    const risk = sys?.risk ?? "unknown";
    const color = RISK_COLOR[risk];
    const bg = RISK_BG[risk];
    const x = MARGIN + i * (gaugeW + 9);

    doc.roundedRect(x, y, gaugeW, 56, 5).fillColor(bg).fill();
    doc.font("zh-bold").fontSize(8).fillColor("#475569");
    doc.text(SYSTEM_TITLES[k], x + 10, y + 6);

    // mini ring
    const score =
      risk === "high" ? 85 : risk === "medium" ? 55 : risk === "low" ? 20 : 0;
    drawRingGauge(doc, x + 24, y + 34, 14, score, 100, color);
    // risk label inside
    const rl = RISK_LABEL[risk];
    doc.font("zh-bold").fontSize(7).fillColor(color);
    const rlW = doc.widthOfString(rl);
    doc.text(rl, x + 24 - rlW / 2, y + 30);

    // small description right of ring
    doc.font("zh").fontSize(7).fillColor("#64748b");
    const desc =
      risk === "high"
        ? "需立刻关注"
        : risk === "medium"
          ? "开始亮黄灯"
          : risk === "low"
            ? "目前稳定"
            : "未评估";
    doc.text(desc, x + 46, y + 30, { width: gaugeW - 50 });
  });

  // ─── 5. Two-column body (左：为什么 / 右：体检数值 or 数据) ────
  y = 200;
  const leftX = MARGIN;
  const rightColX = MARGIN + COL_W + COL_GAP;

  // ── Left column: Why this result (top concerns + key red flags) ──
  const leftYStart = y;
  doc.font("zh-bold").fontSize(10).fillColor("#0f172a");
  doc.text("⚠ 为什么是这个结果？", leftX, y);
  doc.y = y + 14;

  // Pull the top 4-5 red flags across all 3 systems
  const allRedFlags: { module: string; short: string; ans: string }[] = [];
  for (const m of ["kidney", "blood_pressure", "blood_sugar"] as InsightModule[]) {
    const flags = getRedFlags(args.answers, m);
    for (const f of flags) {
      allRedFlags.push({
        module: m,
        short: f.shortText,
        ans: f.userAnswer,
      });
    }
  }
  // Take top 5 (already sorted by score desc within module)
  const topFlags = allRedFlags.slice(0, 5);

  if (topFlags.length > 0) {
    doc.font("zh").fontSize(8.5).fillColor("#475569");
    doc.text("最关键的风险信号：", leftX, doc.y, { width: COL_W });
    doc.moveDown(0.2);
    for (const f of topFlags) {
      const dotY = doc.y + 4;
      doc.circle(leftX + 4, dotY, 2).fillColor("#dc2626").fill();
      doc.font("zh").fontSize(8.5).fillColor("#0f172a");
      doc.text(`${f.short} → `, leftX + 12, doc.y, {
        continued: true,
        width: COL_W - 12,
      });
      doc.font("zh-bold").fillColor("#b45309");
      doc.text(f.ans, { width: COL_W - 12 });
      doc.font("zh");
    }
  } else {
    doc.font("zh").fontSize(8.5).fillColor("#475569");
    doc.text(
      "目前没有明显高风险信号。继续保持健康生活方式，定期复查就好。",
      leftX,
      doc.y,
      { width: COL_W }
    );
    doc.moveDown(0.3);
  }

  // Top concerns (1-2 lines)
  if (result.topConcerns?.length) {
    doc.moveDown(0.3);
    doc.font("zh-bold").fontSize(8).fillColor("#475569");
    doc.text("AI 总结：", leftX, doc.y, { width: COL_W });
    doc.font("zh").fontSize(8.5).fillColor("#0f172a");
    const concern = result.topConcerns[0];
    doc.text(concern, leftX, doc.y, { width: COL_W });
  }

  const leftYEnd = doc.y;

  // ── Right column: Lab values OR Malaysia stats ──
  doc.font("zh-bold").fontSize(10).fillColor("#0f172a");
  doc.text("📋 体检数值", rightColX, leftYStart);
  doc.y = leftYStart + 14;

  const hasLabs = labValues && hasAnyLabValue(labValues);
  if (hasLabs) {
    const summary = summarizeLabs(labValues!, registration.gender);
    doc.font("zh").fontSize(7.5).fillColor("#64748b");
    // Mini header
    const labY0 = doc.y;
    doc.text("指标", rightColX, labY0, { width: 105 });
    doc.text("数值", rightColX + 105, labY0, { width: 60 });
    doc.text("评估", rightColX + 165, labY0, { width: COL_W - 165 });
    doc
      .moveTo(rightColX, labY0 + 10)
      .lineTo(rightColX + COL_W, labY0 + 10)
      .strokeColor("#e2e8f0")
      .stroke();
    doc.y = labY0 + 13;

    for (const item of summary) {
      const rowY = doc.y;
      const c = RISK_COLOR[item.check.level];
      doc.font("zh").fontSize(8).fillColor("#334155");
      doc.text(item.label, rightColX, rowY, { width: 105 });
      doc.font("zh-bold").fillColor(c);
      doc.text(`${item.value} ${item.unit}`, rightColX + 105, rowY, {
        width: 60,
      });
      doc.font("zh").fontSize(7.5).fillColor(c);
      doc.text(item.check.label, rightColX + 165, rowY, {
        width: COL_W - 165,
      });
      doc.y = rowY + 12;
    }

    const egfr = computeEGFR(labValues!, registration.age, registration.gender);
    if (egfr) {
      doc.moveDown(0.2);
      const egfrColor = RISK_COLOR[egfr.risk];
      const egfrY = doc.y;
      doc
        .roundedRect(rightColX, egfrY, COL_W, 28, 4)
        .fillColor("#ecfdf5")
        .fill();
      doc.font("zh-bold").fontSize(8).fillColor("#065f46");
      doc.text("🧮 eGFR", rightColX + 6, egfrY + 4);
      doc.font("zh-bold").fontSize(13).fillColor(egfrColor);
      doc.text(`${egfr.egfr}`, rightColX + 6, egfrY + 14, { continued: true });
      doc.font("zh").fontSize(7).fillColor("#065f46");
      doc.text(`  mL/min  ·  ${egfr.label}`);
      doc.y = egfrY + 32;
    }
  } else {
    doc.font("zh").fontSize(8.5).fillColor("#64748b");
    doc.text(
      "客户未提供化验数值。本次评估基于症状问卷。建议下次带体检报告，可获得更精准的数值分析（包括 eGFR 自动计算）。",
      rightColX,
      leftYStart + 14,
      { width: COL_W }
    );
    doc.moveDown(0.4);
    // small Malaysia fact instead
    doc.font("zh-bold").fontSize(8).fillColor("#7f1d1d");
    doc.text("📍 马来西亚现况", rightColX, doc.y);
    doc.font("zh").fontSize(7.5).fillColor("#475569");
    doc.text(`🫘 ${MY_STATS.ckd.fact}`, rightColX, doc.y + 2, {
      width: COL_W,
    });
    doc.moveDown(0.2);
    doc.text(`🩸 ${MY_STATS.diabetes.fact}`, rightColX, doc.y, {
      width: COL_W,
    });
    doc.moveDown(0.2);
    doc.text(`❤️ ${MY_STATS.hypertension.fact}`, rightColX, doc.y, {
      width: COL_W,
    });
  }

  const rightYEnd = doc.y;
  const bodyBottomY = Math.max(leftYEnd, rightYEnd) + 8;

  // ─── 6. Action steps (3 specific) ──────────────────────────────
  y = Math.max(bodyBottomY, 405);
  doc
    .roundedRect(MARGIN, y, CONTENT_W, 70, 6)
    .fillColor("#f0fdf4")
    .fill();
  doc.font("zh-bold").fontSize(10).fillColor("#065f46");
  doc.text("✅ 该怎么办？— 今天就可以做的事", MARGIN + 8, y + 6);

  const actions = (result.immediateActions ?? []).slice(0, 3);
  if (actions.length === 0) {
    doc.font("zh").fontSize(8.5).fillColor("#0f172a");
    doc.text("保持良好生活习惯，定期复查。", MARGIN + 8, y + 22);
  } else {
    actions.forEach((a, i) => {
      const aY = y + 22 + i * 14;
      doc.font("zh-bold").fontSize(8.5).fillColor("#059669");
      doc.text(`${i + 1}.`, MARGIN + 8, aY, { continued: true });
      doc.font("zh").fillColor("#0f172a");
      doc.text(` ${a}`, { width: CONTENT_W - 16 });
    });
  }

  // followUpAdvice (small)
  if (result.followUpAdvice) {
    doc.font("zh").fontSize(7).fillColor("#65a30d");
    doc.text(
      `📅 ${result.followUpAdvice}`,
      MARGIN + 8,
      y + 60,
      { width: CONTENT_W - 16 }
    );
  }

  // ─── 7. Malaysia mini-stats bar (if labs were shown, this still goes here) ─
  y = y + 78;
  doc
    .roundedRect(MARGIN, y, CONTENT_W, 26, 4)
    .fillColor("#fef3c7")
    .fill();
  doc.font("zh-bold").fontSize(7).fillColor("#78350f");
  doc.text("📍 你正在马来西亚的「沉默杀手」名单上", MARGIN + 8, y + 5);
  doc.font("zh").fontSize(7).fillColor("#7c2d12");
  doc.text(
    `${MY_STATS.ckd.ratio} 有 CKD · ${MY_STATS.diabetes.ratio} 有糖尿病 · ${MY_STATS.hypertension.ratio} 有高血压 · 每 25 分钟 1 人新患肾衰竭`,
    MARGIN + 8,
    y + 16,
    { width: CONTENT_W - 16 }
  );

  // ─── 8. WhatsApp CTA + Footer (bottom) ─────────────────────────
  y = y + 32;
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "60123456789";
  doc
    .roundedRect(MARGIN, y, CONTENT_W, 24, 4)
    .fillColor("#059669")
    .fill();
  doc.font("zh-bold").fontSize(9).fillColor("#ffffff");
  doc.text(
    `💬 想了解护肾王怎么帮你？  WhatsApp：${wa}`,
    MARGIN + 8,
    y + 7,
    { width: CONTENT_W - 16, align: "center" }
  );

  // ─── 9. Footer disclaimer + citations ──────────────────────────
  y = y + 30;

  // Collect unique citation shorts from systems
  const citationShorts = new Set<string>();
  for (const k of ["kidney", "blood_pressure", "blood_sugar"] as SystemKey[]) {
    const sys = result.systems[k];
    if (sys?.citationKey) {
      const c = getCitation(sys.citationKey);
      if (c) citationShorts.add(c.short);
    }
  }

  doc.font("zh").fontSize(6.5).fillColor("#94a3b8");
  doc.text(
    `📖 科学依据：${Array.from(citationShorts).slice(0, 4).join(" · ") || "KDIGO 2024 / MOH Malaysia CPG / NHMS 2018-2019 / ADA 2024"}`,
    MARGIN,
    y,
    { width: CONTENT_W }
  );
  doc.text(
    "本报告由 AI 生成，仅供健康参考，不构成医疗诊断或处方。如有疑虑请咨询注册医生。",
    MARGIN,
    y + 11,
    { width: CONTENT_W }
  );

  // Brand strip bottom
  doc.rect(0, 832, PAGE_W, 4).fill("#10b981");
  doc.rect(0, 836, PAGE_W, 6).fill("#059669");
}

// ─── Helpers ───────────────────────────────────────────────────

// Draws a ring gauge centered at (cx, cy) with radius r.
// Background is grey, foreground arcs from -90° based on value/max.
function drawRingGauge(
  doc: PDFKit.PDFDocument,
  cx: number,
  cy: number,
  r: number,
  value: number,
  max: number,
  color: string
) {
  const thickness = Math.max(3, r * 0.22);
  // Background ring
  doc
    .circle(cx, cy, r - thickness / 2)
    .lineWidth(thickness)
    .strokeColor("#e2e8f0")
    .stroke();

  if (value <= 0 || max <= 0) return;

  const pct = Math.max(0, Math.min(1, value / max));
  if (pct >= 0.999) {
    doc
      .circle(cx, cy, r - thickness / 2)
      .lineWidth(thickness)
      .strokeColor(color)
      .stroke();
    return;
  }

  // Foreground arc via cubic bezier approximation — for simplicity
  // draw with line segments around the circle (PDFKit doesn't expose arc).
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + pct * 2 * Math.PI;
  const steps = Math.max(8, Math.round(48 * pct));
  const innerR = r - thickness / 2;
  doc.save();
  doc.lineWidth(thickness).strokeColor(color).lineCap("round");
  doc.moveTo(
    cx + Math.cos(startAngle) * innerR,
    cy + Math.sin(startAngle) * innerR
  );
  for (let i = 1; i <= steps; i++) {
    const a = startAngle + (i / steps) * (endAngle - startAngle);
    doc.lineTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
  }
  doc.stroke();
  doc.restore();
}
