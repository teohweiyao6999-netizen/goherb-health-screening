import type {
  Registration,
  AnalysisResult,
  SymptomAnswer,
  SystemKey,
} from "./types";
import { MY_STATS, URGENCY_FACTS } from "./malaysia-stats";
import { getCitation } from "./citations";
import { getRedFlags, type InsightModule } from "./answer-insights";
import {
  type LabValues,
  summarizeLabs,
  computeEGFR,
  hasAnyLabValue,
} from "./lab-values";

// ════════════════════════════════════════════════════════════════
// Single-page A4 HTML template, rendered by Puppeteer.
// Designed to fill the entire page (no whitespace).
// ════════════════════════════════════════════════════════════════

interface Args {
  registration: Registration;
  answers: Record<string, SymptomAnswer>;
  result: AnalysisResult;
  labValues?: LabValues;
}

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

function renderBold(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<b class="hl">$1</b>')
    .replace(/\n/g, "<br/>");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const RISK_HEX = {
  low: "#059669",
  medium: "#d97706",
  high: "#dc2626",
  unknown: "#94a3b8",
};

const RISK_BG = {
  low: "#ecfdf5",
  medium: "#fffbeb",
  high: "#fef2f2",
  unknown: "#f1f5f9",
};

const RISK_BORDER = {
  low: "#a7f3d0",
  medium: "#fcd34d",
  high: "#fca5a5",
  unknown: "#cbd5e1",
};

const RISK_LABEL = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
  unknown: "—",
};

const SYSTEM_NAMES: Record<SystemKey, string> = {
  kidney: "肾脏",
  blood_pressure: "血压",
  blood_sugar: "血糖",
  lipids: "血脂",
};

const SYSTEM_ICONS: Record<SystemKey, string> = {
  kidney: "🫘",
  blood_pressure: "❤️",
  blood_sugar: "🩸",
  lipids: "🧈",
};

function gaugeSvg(value: number, max: number, color: string, size = 40): string {
  const pct = Math.max(0, Math.min(1, value / max));
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  const cx = size / 2;
  const cy = size / 2;
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="4"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="4"
        stroke-dasharray="${dash} ${c}" stroke-linecap="round"
        transform="rotate(-90 ${cx} ${cy})"/>
    </svg>
  `;
}

// Lab value bar showing user's value vs normal range
function labBarHtml(
  label: string,
  value: number,
  unit: string,
  min: number,
  max: number,
  safeMin: number,
  safeMax: number,
  riskColor: string
): string {
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
  const userPct = pct(value);
  const safeStart = pct(safeMin);
  const safeEnd = pct(safeMax);
  return `
    <div class="lab-bar-row">
      <div class="lab-bar-label">
        <span>${escapeHtml(label)}</span>
        <b style="color:${riskColor}">${value} ${unit}</b>
      </div>
      <div class="lab-bar-track">
        <div class="lab-bar-safe" style="left:${safeStart}%; width:${safeEnd - safeStart}%"></div>
        <div class="lab-bar-marker" style="left:calc(${userPct}% - 4px); background:${riskColor}"></div>
      </div>
    </div>
  `;
}

const LAB_RANGES: Record<
  string,
  { min: number; max: number; safeMin: (g: "male" | "female") => number; safeMax: (g: "male" | "female") => number }
> = {
  systolic: { min: 80, max: 180, safeMin: () => 90, safeMax: () => 130 },
  diastolic: { min: 50, max: 120, safeMin: () => 60, safeMax: () => 85 },
  fpg: { min: 3, max: 12, safeMin: () => 3.9, safeMax: () => 6.0 },
  hba1c: { min: 4, max: 10, safeMin: () => 4, safeMax: () => 5.7 },
  creatinine: {
    min: 30,
    max: 200,
    safeMin: (g) => (g === "female" ? 44 : 62),
    safeMax: (g) => (g === "female" ? 80 : 106),
  },
  urea: { min: 0, max: 15, safeMin: () => 2.5, safeMax: () => 7.5 },
  uricAcid: {
    min: 100,
    max: 600,
    safeMin: () => 0,
    safeMax: (g) => (g === "female" ? 360 : 420),
  },
};

export function buildReportHtml(args: Args): string {
  const { registration, result, answers, labValues } = args;
  const overall = result.overallRisk;
  const overallColor = RISK_HEX[overall];
  const overallBg = RISK_BG[overall];
  const overallBorder = RISK_BORDER[overall];

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

  // ─── 3-system cards (top row) ───────────────────────────
  const systemKeys: SystemKey[] = ["kidney", "blood_pressure", "blood_sugar"];
  const systemCards = systemKeys
    .map((k) => {
      const sys = result.systems[k];
      const risk = sys?.risk ?? "unknown";
      const color = RISK_HEX[risk];
      const score =
        risk === "high" ? 88 : risk === "medium" ? 55 : risk === "low" ? 22 : 0;
      return `
        <div class="sys-card" style="background:${RISK_BG[risk]};border-color:${RISK_BORDER[risk]}">
          <div class="sys-card-left">
            ${gaugeSvg(score, 100, color, 36)}
          </div>
          <div class="sys-card-right">
            <div class="sys-card-name">${SYSTEM_ICONS[k]} ${SYSTEM_NAMES[k]}</div>
            <div class="sys-card-risk" style="color:${color}">${RISK_LABEL[risk]}</div>
          </div>
        </div>
      `;
    })
    .join("");

  // ─── Red flags ───────────────────────────────────────────
  const allRedFlags: { module: string; short: string; ans: string }[] = [];
  for (const m of ["kidney", "blood_pressure", "blood_sugar"] as InsightModule[]) {
    const flags = getRedFlags(answers, m);
    for (const f of flags) {
      allRedFlags.push({ module: m, short: f.shortText, ans: f.userAnswer });
    }
  }
  const topFlags = allRedFlags.slice(0, 5);
  const redFlagsHtml =
    topFlags.length > 0
      ? `<ul class="flag-list">
           ${topFlags
             .map(
               (f) => `<li>
                 <span class="flag-dot"></span>
                 <span class="flag-text">${escapeHtml(f.short)}</span>
                 <span class="flag-arrow">→</span>
                 <b class="flag-ans">${escapeHtml(f.ans)}</b>
               </li>`
             )
             .join("")}
         </ul>`
      : `<p class="muted">目前没有明显高风险信号，继续保持。</p>`;

  // ─── Per-system detailed blocks (3 systems) ──────────────
  const systemDetailsHtml = systemKeys
    .map((k) => {
      const sys = result.systems[k];
      if (!sys) return "";
      const color = RISK_HEX[sys.risk];
      const bg = RISK_BG[sys.risk];
      const border = RISK_BORDER[sys.risk];
      return `
        <div class="sys-detail" style="background:${bg};border-color:${border}">
          <div class="sys-detail-head">
            <span class="sys-detail-icon">${SYSTEM_ICONS[k]}</span>
            <span class="sys-detail-name">${SYSTEM_NAMES[k]}</span>
            <span class="sys-detail-risk" style="color:${color}">${RISK_LABEL[sys.risk]}</span>
          </div>
          ${sys.paragraph ? `<div class="sys-detail-para">${renderBold(sys.paragraph)}</div>` : ""}
          ${sys.riskExplanation ? `<div class="sys-detail-explain"><b>拖下去会怎样：</b>${escapeHtml(sys.riskExplanation)}</div>` : ""}
        </div>
      `;
    })
    .join("");

  // ─── Lab values block ──────────────────────────────────
  const hasLabs = labValues && hasAnyLabValue(labValues);
  let labBlockHtml = "";
  if (hasLabs) {
    const summary = summarizeLabs(labValues!, registration.gender);
    const rows = summary
      .map((item) => {
        const r = LAB_RANGES[item.key];
        const bar = r
          ? labBarHtml(
              item.label,
              item.value,
              item.unit,
              r.min,
              r.max,
              r.safeMin(registration.gender),
              r.safeMax(registration.gender),
              RISK_HEX[item.check.level]
            )
          : "";
        return bar;
      })
      .join("");
    const egfr = computeEGFR(labValues!, registration.age, registration.gender);
    const egfrHtml = egfr
      ? `<div class="egfr" style="border-color:${RISK_HEX[egfr.risk]}">
          <div class="egfr-row">
            <div class="egfr-label">🧮 eGFR (自动计算)</div>
            <div class="egfr-value" style="color:${RISK_HEX[egfr.risk]}">
              <b>${egfr.egfr}</b><span class="egfr-unit">mL/min/1.73m²</span>
            </div>
          </div>
          <div class="egfr-stage">CKD 分期：<b>${escapeHtml(egfr.label)}</b> · 公式：CKD-EPI 2021 (KDIGO 2024)</div>
        </div>`
      : "";
    labBlockHtml = `
      <div class="lab-bars">${rows}</div>
      ${egfrHtml}
      <div class="lab-legend">
        <span><span class="dot-safe"></span> 正常区间</span>
        <span><span class="dot-risk"></span> 您的数值位置</span>
      </div>
    `;
  } else {
    labBlockHtml = `
      <p class="muted small">客户未提供化验数值。本评估基于 31 题症状问卷。建议下次带血液 + 尿液体检报告，可获得 eGFR 自动计算和数值精准对比。</p>
      <div class="urgency-grid">
        ${URGENCY_FACTS.slice(0, 4)
          .map(
            (f) => `<div class="urgency-item">
              <span class="urgency-icon">${escapeHtml(f.icon)}</span>
              <div>
                <div class="urgency-fact">${escapeHtml(f.fact)}</div>
                <div class="urgency-src">${escapeHtml(f.source)}</div>
              </div>
            </div>`
          )
          .join("")}
      </div>
    `;
  }

  // ─── Actions: immediate + lifestyle ────────────────────
  const immediate = (result.immediateActions ?? []).slice(0, 3);
  const lifestyle = (result.lifestyleAdvice ?? []).filter((a) => a && a !== "...").slice(0, 4);

  const immediateHtml = immediate.length
    ? immediate
        .map(
          (a, i) => `
            <div class="action-item">
              <span class="action-num immediate">${i + 1}</span>
              <span class="action-text">${escapeHtml(a)}</span>
            </div>
          `
        )
        .join("")
    : `<p class="muted small">保持良好生活习惯，定期复查。</p>`;

  const lifestyleHtml = lifestyle.length
    ? lifestyle
        .map(
          (a) => `
            <div class="action-item">
              <span class="action-num lifestyle">•</span>
              <span class="action-text">${escapeHtml(a)}</span>
            </div>
          `
        )
        .join("")
    : "";

  // ─── Citations ─────────────────────────────────────
  const citationFulls: { short: string; full: string }[] = [];
  const seen = new Set<string>();
  for (const k of systemKeys) {
    const sys = result.systems[k];
    if (sys?.citationKey && !seen.has(sys.citationKey)) {
      const c = getCitation(sys.citationKey);
      if (c) {
        citationFulls.push({ short: c.short, full: c.full });
        seen.add(sys.citationKey);
      }
    }
  }
  const citationsHtml = citationFulls.length
    ? `<ol class="cite-list">
        ${citationFulls
          .map(
            (c) => `<li><b>${escapeHtml(c.short)}.</b> ${escapeHtml(c.full)}</li>`
          )
          .join("")}
      </ol>`
    : "";

  // ═════════════════════════════════════════════════════
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<title>GoHerb 健康风险评估报告</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", -apple-system, BlinkMacSystemFont, sans-serif;
    color: #0f172a;
    background: #fff;
    font-size: 7.8px;
    line-height: 1.35;
  }
  .page {
    width: 210mm;
    height: 297mm;
    padding: 8mm 9mm 6mm 9mm;
    display: flex;
    flex-direction: column;
    gap: 2mm;
    position: relative;
    overflow: hidden;
    page-break-after: avoid;
    page-break-inside: avoid;
  }
  /* Compress content to ensure single page */
  .page-inner {
    display: flex;
    flex-direction: column;
    gap: 2mm;
    flex: 1;
    transform-origin: top left;
  }
  .brand-top {
    position: absolute; top: 0; left: 0; right: 0; height: 4mm;
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  }
  .brand-bot {
    position: absolute; bottom: 0; left: 0; right: 0; height: 3mm;
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  }

  /* Header */
  .hdr {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-top: 1mm;
  }
  .hdr-title { font-size: 13px; font-weight: 800; color: #065f46; letter-spacing: -0.3px; line-height: 1.1; }
  .hdr-sub { font-size: 7px; color: #64748b; margin-top: 1px; }
  .hdr-right { text-align: right; font-size: 7px; line-height: 1.4; }
  .hdr-name { font-size: 9.5px; font-weight: 700; color: #0f172a; }
  .hdr-meta { color: #94a3b8; }
  .hdr-line { font-size: 7.5px; color: #475569; }

  /* Hero card */
  .hero {
    display: flex;
    gap: 3mm;
    padding: 2.5mm 3mm;
    border-radius: 5px;
    background: ${overallBg};
    border: 1.5px solid ${overallBorder};
  }
  .hero-score-box {
    width: 19mm;
    text-align: center;
    border-right: 1px dashed ${overallBorder};
    padding-right: 2mm;
  }
  .hero-score { font-size: 24px; font-weight: 900; color: ${overallColor}; line-height: 1; letter-spacing: -1px; }
  .hero-score-100 { font-size: 7.5px; color: #64748b; font-weight: 600; }
  .hero-label { font-size: 8.5px; font-weight: 700; color: ${overallColor}; margin-top: 0.5mm; }
  .hero-body { flex: 1; min-width: 0; }
  .hero-headline { font-size: 10px; font-weight: 800; color: ${overallColor}; }
  .hero-sub { font-size: 7.5px; color: #475569; margin-top: 0.5mm; }
  .progress {
    height: 4px; background: rgba(255,255,255,0.7); border-radius: 2px; margin-top: 1mm; overflow: hidden;
  }
  .progress-fill { height: 100%; background: ${overallColor}; border-radius: 2px; }
  .hero-concerns { font-size: 7.5px; color: #1e293b; margin-top: 1mm; line-height: 1.4; }
  .hero-concerns b { color: #b45309; }

  /* 3 system cards (compact horizontal) */
  .sys-row { display: flex; gap: 2.5mm; }
  .sys-card {
    flex: 1;
    padding: 2.5mm;
    border-radius: 5px;
    border: 1px solid;
    display: flex;
    align-items: center;
    gap: 2.5mm;
  }
  .sys-card-left { flex-shrink: 0; }
  .sys-card-right { flex: 1; }
  .sys-card-name { font-size: 9.5px; font-weight: 700; color: #1e293b; }
  .sys-card-risk { font-size: 11px; font-weight: 800; margin-top: 1px; }

  /* Section title */
  .sec-title {
    font-size: 10px; font-weight: 800; color: #0f172a;
    margin: 0 0 1.5mm 0;
    display: flex; align-items: center; gap: 1.5mm;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 1mm;
  }

  /* Body two-col */
  .body-2col { display: flex; gap: 3.5mm; }
  .col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2.5mm; }

  /* Red flag list */
  .panel {
    border-radius: 5px;
    border: 1px solid #e2e8f0;
    padding: 2.5mm 3mm;
    background: #fff;
  }
  .flag-list { list-style: none; padding: 0; margin: 0; }
  .flag-list li {
    display: flex; align-items: center; gap: 1.5mm;
    padding: 1mm 0;
    font-size: 9px;
    border-bottom: 1px dashed #f1f5f9;
  }
  .flag-list li:last-child { border-bottom: none; }
  .flag-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: #dc2626; flex-shrink: 0;
  }
  .flag-text { color: #334155; flex: 1; }
  .flag-arrow { color: #94a3b8; }
  .flag-ans { color: #b45309; background: #fef3c7; padding: 0 3px; border-radius: 2px; font-weight: 700; }

  /* System detail block (one per system) */
  .sys-detail {
    border: 1px solid;
    border-radius: 5px;
    padding: 2mm 2.5mm;
  }
  .sys-detail-head {
    display: flex; align-items: center; gap: 1.5mm;
    font-size: 9.5px; font-weight: 700; color: #1e293b;
    margin-bottom: 1mm;
  }
  .sys-detail-icon { font-size: 11px; }
  .sys-detail-risk { margin-left: auto; font-size: 9px; font-weight: 800; }
  .sys-detail-para { font-size: 8.5px; color: #1e293b; line-height: 1.5; margin-bottom: 1mm; }
  .sys-detail-para b.hl { color: #b45309; background: #fef3c7; padding: 0 2px; border-radius: 2px; font-weight: 700; }
  .sys-detail-explain {
    font-size: 8px; color: #7f1d1d; line-height: 1.5;
    background: rgba(220,38,38,0.05);
    border-left: 2px solid #dc2626;
    padding: 1mm 2mm;
    border-radius: 0 3px 3px 0;
  }
  .sys-detail-explain b { color: #991b1b; }

  /* Lab bars */
  .lab-bars { display: flex; flex-direction: column; gap: 1.5mm; }
  .lab-bar-row {}
  .lab-bar-label {
    display: flex; justify-content: space-between;
    font-size: 8px; color: #475569; margin-bottom: 0.5mm;
  }
  .lab-bar-label b { font-size: 9.5px; font-weight: 800; }
  .lab-bar-track {
    height: 5px; background: #fee2e2; border-radius: 3px; position: relative;
  }
  .lab-bar-safe {
    position: absolute; top: 0; height: 5px; background: #bbf7d0; border-radius: 3px;
  }
  .lab-bar-marker {
    position: absolute; top: -2px; width: 4px; height: 9px;
    border-radius: 1px;
    box-shadow: 0 0 0 1px white;
  }
  .lab-legend {
    display: flex; gap: 4mm; font-size: 7px; color: #64748b;
    margin-top: 1.5mm;
  }
  .lab-legend .dot-safe, .lab-legend .dot-risk {
    display: inline-block; width: 6px; height: 6px; border-radius: 2px;
    margin-right: 2px; vertical-align: middle;
  }
  .lab-legend .dot-safe { background: #bbf7d0; }
  .lab-legend .dot-risk { background: #dc2626; }

  .egfr {
    margin-top: 1.5mm;
    border: 1.5px solid;
    border-radius: 4px;
    padding: 1.5mm 2.5mm;
    background: #f0fdf4;
  }
  .egfr-row { display: flex; justify-content: space-between; align-items: baseline; }
  .egfr-label { font-size: 8.5px; color: #065f46; font-weight: 700; }
  .egfr-value { font-size: 9px; font-weight: 500; }
  .egfr-value b { font-size: 16px; font-weight: 900; line-height: 1; }
  .egfr-unit { font-size: 7.5px; color: #475569; margin-left: 3px; }
  .egfr-stage { font-size: 7.5px; color: #065f46; margin-top: 1px; }

  /* Urgency grid (used when no labs) */
  .urgency-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 1.5mm;
    margin-top: 1.5mm;
  }
  .urgency-item {
    display: flex; gap: 1.5mm; align-items: flex-start;
    background: #fff7ed; border-left: 2px solid #fb923c;
    padding: 1.5mm 2mm; border-radius: 0 3px 3px 0;
  }
  .urgency-icon { font-size: 11px; flex-shrink: 0; }
  .urgency-fact { font-size: 8px; color: #7c2d12; line-height: 1.4; font-weight: 600; }
  .urgency-src { font-size: 6.5px; color: #94a3b8; margin-top: 0.5mm; }

  /* Action lists */
  .actions-immediate {
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    border-color: #86efac;
  }
  .actions-lifestyle {
    background: #f0f9ff; border-color: #bae6fd;
  }
  .action-item {
    display: flex; gap: 2mm; align-items: flex-start;
    padding: 0.8mm 0;
    font-size: 8.5px;
    line-height: 1.5;
  }
  .action-num {
    color: white; width: 4.5mm; height: 4.5mm;
    border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 8px; flex-shrink: 0;
    line-height: 4.5mm;
  }
  .action-num.immediate { background: #059669; }
  .action-num.lifestyle { background: #0284c7; }
  .action-text { color: #1e293b; flex: 1; padding-top: 0.5mm; }

  .followup {
    font-size: 8px; color: #1e40af;
    background: #eff6ff;
    border-left: 2px solid #2563eb;
    padding: 1.5mm 2mm;
    border-radius: 0 3px 3px 0;
    margin-top: 1.5mm;
    line-height: 1.5;
  }

  /* Malaysia stats expanded */
  .my-stats-block {
    background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%);
    border: 1px solid #fcd34d;
    border-radius: 5px;
    padding: 2.5mm 3mm;
  }
  .my-stats-head {
    font-size: 9.5px; font-weight: 800; color: #92400e; margin-bottom: 1.5mm;
  }
  .my-stats-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 2mm;
  }
  .my-stat-card {
    background: white;
    border-radius: 3px;
    padding: 1.5mm 2mm;
    border-left: 2px solid #d97706;
  }
  .my-stat-num { font-size: 11px; font-weight: 900; color: #b45309; }
  .my-stat-desc { font-size: 7.5px; color: #78350f; margin-top: 0.5mm; line-height: 1.3; }
  .my-stat-src { font-size: 6px; color: #a8a29e; margin-top: 0.5mm; }

  /* Footer */
  .footer {
    font-size: 7px; color: #94a3b8; line-height: 1.5;
    padding-top: 1.5mm;
    border-top: 1px solid #f1f5f9;
  }
  .footer b { color: #475569; }
  .cite-list {
    padding-left: 12px; margin: 1mm 0 0 0;
    font-size: 6.5px; color: #94a3b8;
  }
  .cite-list li { margin-bottom: 0.5mm; line-height: 1.4; }
  .cite-list b { color: #475569; }

  .muted { color: #64748b; }
  .small { font-size: 8.5px; }
</style>
</head>
<body>
<div class="page">
  <div class="brand-top"></div>
  <div class="page-inner" id="page-inner">

  <!-- Header -->
  <div class="hdr">
    <div>
      <div class="hdr-title">GoHerb 健康风险评估报告</div>
      <div class="hdr-sub">31 题问卷 + 体检数值 + Claude Opus 4.7 AI 分析</div>
    </div>
    <div class="hdr-right">
      <div class="hdr-name">${escapeHtml(registration.name)}</div>
      <div class="hdr-line">${registration.age} 岁 · ${registration.gender === "male" ? "男" : "女"} · ${escapeHtml(registration.phone)}</div>
      <div class="hdr-meta">编号 ${reportNo} · ${reportDate}</div>
    </div>
  </div>

  <!-- Hero -->
  <div class="hero">
    <div class="hero-score-box">
      <div class="hero-score">${result.overallScore}</div>
      <div class="hero-score-100">/ 100</div>
      <div class="hero-label">${RISK_LABEL[overall]}</div>
    </div>
    <div class="hero-body">
      <div class="hero-headline">
        ${overall === "high" ? "🚨 你的身体正在求救" : overall === "medium" ? "⚠️ 你的健康开始亮黄灯" : "💚 目前看起来还好"}
      </div>
      <div class="hero-sub">
        ${
          overall === "high"
            ? "出现多个明显风险信号 — 越早调理越好。"
            : overall === "medium"
              ? "现在是预防黄金期。中风险阶段做对几件事，多数能在 4 个月内稳定下来。"
              : "继续保持，每年体检追踪就好。"
        }
      </div>
      <div class="progress"><div class="progress-fill" style="width: ${Math.min(100, result.overallScore)}%"></div></div>
      ${
        result.topConcerns?.length
          ? `<div class="hero-concerns"><b>⚠ AI 总结：</b>${escapeHtml(result.topConcerns.slice(0, 2).join("；"))}</div>`
          : ""
      }
    </div>
  </div>

  <!-- 3 system cards -->
  <div class="sys-row">${systemCards}</div>

  <!-- Body 2-col -->
  <div class="body-2col">
    <!-- Left: red flags + 3 system details -->
    <div class="col">
      <div class="panel">
        <div class="sec-title">⚠ 你的关键风险信号</div>
        ${redFlagsHtml}
      </div>
      ${systemDetailsHtml}
    </div>

    <!-- Right: lab values + actions -->
    <div class="col">
      <div class="panel">
        <div class="sec-title">📋 体检数值${hasLabs ? " vs 正常范围" : ""}</div>
        ${labBlockHtml}
      </div>
      <div class="panel actions-immediate">
        <div class="sec-title" style="color:#065f46">✅ 今天就可以做的事</div>
        ${immediateHtml}
      </div>
      ${
        lifestyleHtml
          ? `<div class="panel actions-lifestyle">
              <div class="sec-title" style="color:#0c4a6e">🌿 长期生活调整</div>
              ${lifestyleHtml}
            </div>`
          : ""
      }
      ${result.followUpAdvice ? `<div class="followup">📅 ${escapeHtml(result.followUpAdvice)}</div>` : ""}
    </div>
  </div>

  <!-- Malaysia stats expanded -->
  <div class="my-stats-block">
    <div class="my-stats-head">📍 马来西亚现况 — 你正在「沉默杀手」名单上</div>
    <div class="my-stats-grid">
      <div class="my-stat-card">
        <div class="my-stat-num">${escapeHtml(MY_STATS.ckd.ratio)}</div>
        <div class="my-stat-desc">成年人有慢性肾病 CKD</div>
        <div class="my-stat-src">NHMS 2018</div>
      </div>
      <div class="my-stat-card">
        <div class="my-stat-num">${escapeHtml(MY_STATS.diabetes.ratio)}</div>
        <div class="my-stat-desc">成年人有糖尿病</div>
        <div class="my-stat-src">NHMS 2019</div>
      </div>
      <div class="my-stat-card">
        <div class="my-stat-num">${escapeHtml(MY_STATS.hypertension.ratio)}</div>
        <div class="my-stat-desc">成年人有高血压</div>
        <div class="my-stat-src">NHMS 2019</div>
      </div>
      <div class="my-stat-card">
        <div class="my-stat-num">每 25 分钟 1 人</div>
        <div class="my-stat-desc">马来西亚新增肾衰竭患者</div>
        <div class="my-stat-src">MDTR 2022</div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div><b>📖 科学依据：</b></div>
    ${citationsHtml}
    <div style="margin-top: 1mm;">本报告由 AI（Claude Opus 4.7）根据问卷与体检数值生成，仅供健康参考，不构成医疗诊断或处方。如有疑虑请咨询注册医生。</div>
  </div>

  </div>
  <div class="brand-bot"></div>
</div>
</body>
</html>`;
}
