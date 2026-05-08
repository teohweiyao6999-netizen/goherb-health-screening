import PDFDocument from "pdfkit";
import path from "path";
import type { Registration, AnalysisResult, SymptomAnswer, SystemKey } from "./types";
import { QUESTIONS, getModuleLabel } from "./questions";
import {
  MY_STATS,
  URGENCY_FACTS,
  getMalaysiaAverageScore,
  getDurationInsight,
} from "./malaysia-stats";
import { getCitation } from "./citations";

const FONT_REG = path.join(process.cwd(), "lib/fonts/NotoSansSC-Regular.otf");
const FONT_BOLD = path.join(process.cwd(), "lib/fonts/NotoSansSC-Bold.otf");

const SYSTEM_TITLES: Record<SystemKey, string> = {
  kidney: "肾脏健康",
  blood_pressure: "血压系统",
  blood_sugar: "血糖系统",
  lipids: "血脂系统",
};

const RISK_LABEL = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
  unknown: "未评估",
};

const RISK_COLOR = {
  low: "#059669",
  medium: "#d97706",
  high: "#dc2626",
  unknown: "#64748b",
};

interface BuildPdfArgs {
  registration: Registration;
  answers: Record<string, SymptomAnswer>;
  result: AnalysisResult;
}

export function buildPdfBuffer(args: BuildPdfArgs): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
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

function renderPdf(doc: PDFKit.PDFDocument, args: BuildPdfArgs) {
  const { registration, answers, result } = args;

  // ── Header ──
  doc
    .font("zh-bold")
    .fontSize(22)
    .fillColor("#059669")
    .text("GoHerb 健康风险评估报告", { align: "center" });
  doc
    .font("zh")
    .fontSize(10)
    .fillColor("#64748b")
    .text("AI 健康风险筛查 · 仅供参考，不构成医疗诊断", { align: "center" });

  doc.moveDown(1.5);

  // ── 客户资料 ──
  doc
    .fillColor("#0f172a")
    .font("zh-bold")
    .fontSize(13)
    .text("客户资料", { underline: false });
  doc.moveDown(0.3);
  doc.font("zh").fontSize(11).fillColor("#334155");
  const reportDate = new Date().toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(`姓名：${registration.name}`);
  doc.text(`电话：${registration.phone}`);
  doc.text(
    `年龄：${registration.age} 岁  ·  性别：${registration.gender === "male" ? "男" : "女"}`
  );
  doc.text(`报告日期：${reportDate}`);
  doc.moveDown(1);

  // ── 整体评分 ──
  doc
    .font("zh-bold")
    .fontSize(13)
    .fillColor("#0f172a")
    .text("整体风险评分");
  doc.moveDown(0.3);

  const overallColor = RISK_COLOR[result.overallRisk] ?? "#64748b";
  doc
    .font("zh-bold")
    .fontSize(36)
    .fillColor(overallColor)
    .text(`${result.overallScore} / 100`, { continued: false });
  doc
    .font("zh-bold")
    .fontSize(14)
    .fillColor(overallColor)
    .text(`${RISK_LABEL[result.overallRisk] ?? ""}`);

  // Progress bar
  const barY = doc.y + 6;
  const barX = 50;
  const barW = doc.page.width - 100;
  doc.rect(barX, barY, barW, 12).fill("#e2e8f0");
  const filled = Math.max(0, Math.min(100, result.overallScore)) / 100;
  doc.rect(barX, barY, barW * filled, 12).fill(overallColor);
  doc.fillColor("#0f172a");
  doc.y = barY + 24;
  doc.moveDown(1);

  // ── 各系统简要 ──
  const systemKeys = Object.keys(result.systems) as SystemKey[];
  if (systemKeys.length) {
    doc
      .font("zh-bold")
      .fontSize(13)
      .fillColor("#0f172a")
      .text("各系统风险");
    doc.moveDown(0.3);
    for (const k of systemKeys) {
      const sys = result.systems[k];
      if (!sys) continue;
      const color = RISK_COLOR[sys.risk] ?? "#64748b";
      doc.font("zh").fontSize(11).fillColor("#334155");
      doc.text(`${SYSTEM_TITLES[k]}：`, { continued: true });
      doc.fillColor(color).text(RISK_LABEL[sys.risk] ?? "");
    }
    doc.moveDown(0.5);
  }

  // ── 健康画像 vs 马来西亚平均 ──
  const avg = getMalaysiaAverageScore(registration.age);
  const diff = result.overallScore - avg.overall;
  ensureSpace(doc, 100);
  doc
    .font("zh-bold")
    .fontSize(13)
    .fillColor("#0f172a")
    .text("📊 你 vs 马来西亚同龄人");
  doc.moveDown(0.3);
  doc.font("zh").fontSize(10).fillColor("#475569");
  doc.text(
    `同年龄段（${registration.age} 岁）马来西亚成人平均风险评分：${avg.overall} / 100`
  );
  doc.text(`你的评分：${result.overallScore} / 100`);
  if (diff > 15) {
    doc
      .font("zh-bold")
      .fontSize(11)
      .fillColor("#dc2626")
      .text(`⚠ 你的风险比同龄人高出 ${diff} 分，超出正常范围`);
  } else if (diff > 0) {
    doc
      .font("zh-bold")
      .fontSize(11)
      .fillColor("#d97706")
      .text(`⚠ 你的风险略高于同龄平均（高 ${diff} 分）`);
  } else {
    doc
      .font("zh-bold")
      .fontSize(11)
      .fillColor("#059669")
      .text(`✓ 你的风险低于同龄平均（低 ${Math.abs(diff)} 分）`);
  }
  doc.moveDown(0.6);

  // ── 30 题亮灯地图 ──
  ensureSpace(doc, 100);
  doc
    .font("zh-bold")
    .fontSize(13)
    .fillColor("#0f172a")
    .text("🗺 你的 30 题亮灯地图");
  doc.moveDown(0.3);
  doc.font("zh").fontSize(10).fillColor("#475569");
  const moduleOrder: SystemKey[] = ["kidney", "blood_pressure", "blood_sugar"];
  for (const m of moduleOrder) {
    const qs = QUESTIONS.filter((q) => q.module === m);
    const red = qs.filter((q) => (answers[q.id]?.score ?? 0) >= 2).length;
    const yellow = qs.filter((q) => (answers[q.id]?.score ?? 0) === 1).length;
    const green = qs.length - red - yellow;
    doc.text(
      `${SYSTEM_TITLES[m]}（${qs.length} 题）：🔴 ${red} 颗 · 🟡 ${yellow} 颗 · 🟢 ${green} 颗`
    );
  }
  const lifeQs = QUESTIONS.filter((q) => q.module === "lifestyle");
  const lifeRed = lifeQs.filter((q) => (answers[q.id]?.score ?? 0) >= 2).length;
  const lifeYellow = lifeQs.filter((q) => (answers[q.id]?.score ?? 0) === 1).length;
  const lifeGreen = lifeQs.length - lifeRed - lifeYellow;
  doc.text(
    `生活习惯（${lifeQs.length} 题）：🔴 ${lifeRed} 颗 · 🟡 ${lifeYellow} 颗 · 🟢 ${lifeGreen} 颗`
  );
  doc.moveDown(0.6);

  // ── 拖延时间洞察 ──
  const durationAnswer = answers["duration"];
  if (durationAnswer) {
    const durationValue =
      durationAnswer.answer === "还没特别注意过"
        ? "none"
        : durationAnswer.answer === "最近一两个月才开始"
          ? "1-2_months"
          : durationAnswer.answer === "已经 3–6 个月了"
            ? "3-6_months"
            : durationAnswer.answer === "超过半年，但都拖着没处理"
              ? "6-12_months"
              : "over_1_year";
    const insight = getDurationInsight(durationValue);
    if (insight.message) {
      ensureSpace(doc, 60);
      doc
        .font("zh-bold")
        .fontSize(12)
        .fillColor("#0f172a")
        .text("⏰ 你的健康时间线");
      doc.moveDown(0.2);
      doc
        .font("zh")
        .fontSize(10)
        .fillColor(
          insight.level === "very_late" || insight.level === "late"
            ? "#dc2626"
            : insight.level === "moderate"
              ? "#d97706"
              : "#0c4a6e"
        )
        .text(insight.message);
      doc.moveDown(0.6);
    }
  }

  // ── 4 个月修复期重点 ──
  ensureSpace(doc, 80);
  doc
    .font("zh-bold")
    .fontSize(12)
    .fillColor("#059669")
    .text("🌱 关键期：未来 4 个月");
  doc.moveDown(0.2);
  doc
    .font("zh")
    .fontSize(10)
    .fillColor("#334155")
    .text(
      "肾脏的修复是慢工出细活 — 一般需要持续保养 3–6 个月（建议至少 4 个月）才看得到改变。这段时间是黄金期，过了就要更长时间才能逆转。",
      { paragraphGap: 4 }
    );
  doc.moveDown(0.5);

  // ── 最需要关注 ──
  if (result.topConcerns?.length) {
    ensureSpace(doc, 100);
    doc
      .font("zh-bold")
      .fontSize(13)
      .fillColor("#dc2626")
      .text("⚠ 最需要立刻关注");
    doc.moveDown(0.3);
    doc.font("zh").fontSize(11).fillColor("#334155");
    result.topConcerns.forEach((c, i) => {
      doc.text(`${i + 1}. ${c}`, { indent: 0, paragraphGap: 4 });
    });
    doc.moveDown(0.5);
  }

  // ── 各系统详细 ──
  for (const k of systemKeys) {
    const sys = result.systems[k];
    if (!sys) continue;
    ensureSpace(doc, 180);
    const color = RISK_COLOR[sys.risk] ?? "#64748b";

    doc
      .font("zh-bold")
      .fontSize(13)
      .fillColor("#0f172a")
      .text(`${SYSTEM_TITLES[k]}  ·  `, { continued: true });
    doc.fillColor(color).text(RISK_LABEL[sys.risk]);
    doc.moveDown(0.2);

    if (sys.visualMetaphor) {
      doc
        .font("zh")
        .fontSize(11)
        .fillColor("#475569")
        .text(`💭  ${sys.visualMetaphor}`, { paragraphGap: 6 });
    }

    // Paragraph with **bold** markers — render bold parts with zh-bold
    if (sys.paragraph) {
      renderMarkdownParagraph(doc, sys.paragraph);
      doc.moveDown(0.3);
    }

    if (sys.recommendation) {
      doc
        .font("zh-bold")
        .fontSize(10)
        .fillColor("#0f172a")
        .text("👉 建议：", { continued: true });
      doc.font("zh").fillColor("#334155").text(sys.recommendation);
      doc.moveDown(0.3);
    }

    // Citation (full)
    if (sys.citationKey) {
      const citation = getCitation(sys.citationKey);
      if (citation) {
        doc
          .font("zh-bold")
          .fontSize(8)
          .fillColor("#94a3b8")
          .text("📖 科学依据：", { continued: true });
        doc.font("zh").fillColor("#64748b").text(citation.full, { paragraphGap: 2 });
        if (citation.url) {
          doc.font("zh").fontSize(7).fillColor("#059669").text(citation.url, {
            link: citation.url,
            underline: true,
          });
        }
      }
    }
    doc.moveDown(0.5);
  }

  // ── 行动建议 ──
  if (result.immediateActions?.length) {
    ensureSpace(doc, 100);
    doc
      .font("zh-bold")
      .fontSize(13)
      .fillColor("#0f172a")
      .text("✓ 今天就可以做的事");
    doc.moveDown(0.3);
    doc.font("zh").fontSize(11).fillColor("#334155");
    result.immediateActions.forEach((a) => {
      doc.text(`• ${a}`, { indent: 0, paragraphGap: 4 });
    });
    doc.moveDown(0.5);
  }

  if (result.lifestyleAdvice?.length) {
    ensureSpace(doc, 100);
    doc
      .font("zh-bold")
      .fontSize(13)
      .fillColor("#0f172a")
      .text("🌿 长期生活建议");
    doc.moveDown(0.3);
    doc.font("zh").fontSize(11).fillColor("#334155");
    result.lifestyleAdvice.forEach((a) => {
      doc.text(`• ${a}`, { indent: 0, paragraphGap: 4 });
    });
    doc.moveDown(0.5);
  }

  if (result.followUpAdvice) {
    doc.font("zh").fontSize(11).fillColor("#0c4a6e");
    doc.text(`📅 复查建议：${result.followUpAdvice}`);
    doc.moveDown(0.5);
  }

  // ── 30 题原始答案 ──
  doc.addPage();
  doc.font("zh-bold").fontSize(14).fillColor("#0f172a").text("附录：30 题完整答案");
  doc.moveDown(0.5);

  let lastModule = "";
  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    const a = answers[q.id];
    if (q.module !== lastModule) {
      lastModule = q.module;
      doc.moveDown(0.3);
      doc
        .font("zh-bold")
        .fontSize(12)
        .fillColor("#059669")
        .text(`【${getModuleLabel(q.module)}】`);
    }
    doc.font("zh").fontSize(10).fillColor("#334155");
    doc.text(`${i + 1}. ${q.text}`, { paragraphGap: 1 });
    const score = a?.score ?? 0;
    const dotColor = score >= 2 ? "#dc2626" : score === 1 ? "#d97706" : "#059669";
    doc
      .font("zh")
      .fontSize(10)
      .fillColor(dotColor)
      .text(`   答：${a?.answer ?? "未作答"}`, { paragraphGap: 4 });
  }

  // ── 马来西亚健康事实 ──
  doc.addPage();
  doc
    .font("zh-bold")
    .fontSize(14)
    .fillColor("#0f172a")
    .text("📍 马来西亚健康事实");
  doc.moveDown(0.3);
  doc.font("zh").fontSize(10).fillColor("#334155");
  doc.text(`🫘 ${MY_STATS.ckd.fact}`, { paragraphGap: 4 });
  doc
    .fontSize(8)
    .fillColor("#94a3b8")
    .text(`   来源：${MY_STATS.ckd.source}`, { paragraphGap: 6 });
  doc
    .fontSize(10)
    .fillColor("#334155")
    .text(`🩸 ${MY_STATS.diabetes.fact}`, { paragraphGap: 4 });
  doc
    .fontSize(8)
    .fillColor("#94a3b8")
    .text(`   来源：${MY_STATS.diabetes.source}`, { paragraphGap: 6 });
  doc
    .fontSize(10)
    .fillColor("#334155")
    .text(`❤️ ${MY_STATS.hypertension.fact}`, { paragraphGap: 4 });
  doc
    .fontSize(8)
    .fillColor("#94a3b8")
    .text(`   来源：${MY_STATS.hypertension.source}`, { paragraphGap: 6 });
  doc
    .fontSize(10)
    .fillColor("#334155")
    .text(`💉 ${MY_STATS.dialysis.fact}`, { paragraphGap: 4 });
  doc
    .fontSize(8)
    .fillColor("#94a3b8")
    .text(`   来源：${MY_STATS.dialysis.source}`, { paragraphGap: 6 });

  doc.moveDown(0.5);
  doc
    .font("zh-bold")
    .fontSize(12)
    .fillColor("#0f172a")
    .text("💡 你应该知道的事实");
  doc.moveDown(0.3);
  for (const f of URGENCY_FACTS) {
    doc.font("zh").fontSize(10).fillColor("#334155");
    doc.text(`${f.icon}  ${f.fact}`, { paragraphGap: 2 });
    doc
      .fontSize(8)
      .fillColor("#94a3b8")
      .text(`   来源：${f.source}`, { paragraphGap: 6 });
  }

  // ── Footer / disclaimer ──
  doc.moveDown(1);
  doc
    .font("zh")
    .fontSize(9)
    .fillColor("#64748b")
    .text(
      result.disclaimer ||
        "本报告由 AI 根据用户填写的问卷生成，仅供参考，不构成医疗诊断、治疗建议或处方。如有任何健康疑虑，请咨询注册医生。",
      { align: "justify", paragraphGap: 4 }
    );

  doc.moveDown(0.5);
  doc
    .font("zh-bold")
    .fontSize(10)
    .fillColor("#059669")
    .text("GoHerb 护肾王 · 守护你的肾脏健康", { align: "center" });
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}

// Renders a paragraph that uses **bold** markdown markers.
// Bold parts get the zh-bold font + a yellow highlight background.
function renderMarkdownParagraph(doc: PDFKit.PDFDocument, text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((p) => p.length > 0);
  doc.font("zh").fontSize(11).fillColor("#0f172a");
  parts.forEach((part, idx) => {
    const isLast = idx === parts.length - 1;
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      doc.font("zh-bold").fillColor("#b45309").text(inner, {
        continued: !isLast,
      });
    } else {
      doc.font("zh").fillColor("#0f172a").text(part, {
        continued: !isLast,
      });
    }
  });
}
