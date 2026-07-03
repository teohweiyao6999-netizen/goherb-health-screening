// ════════════════════════════════════════════════════════════════
// 体检数值（lab values）— 销售可填，可空着
//
// 所有字段都 optional。AI 看到有数值时用数值优先，没数值时回退到症状。
// ════════════════════════════════════════════════════════════════

import type { Gender, RiskLevel } from "./types";
import { calculateEGFR, getCKDStage } from "./calculators";

export interface LabValues {
  systolic?: number; // 收缩压 mmHg
  diastolic?: number; // 舒张压 mmHg
  fpg?: number; // 空腹血糖 mmol/L
  hba1c?: number; // 糖化血红蛋白 %
  creatinine?: number; // 肌酐 μmol/L
  urea?: number; // 尿素 mmol/L
  uricAcid?: number; // 尿酸 μmol/L
}

export const EMPTY_LAB_VALUES: LabValues = {};

export type LabFieldKey = keyof LabValues;

export interface LabFieldSpec {
  key: LabFieldKey;
  label: string;
  unit: string;
  placeholder: string;
  // For "normal range" displays
  normal: string;
  // Section it belongs to (for grouping)
  section: "bp" | "sugar" | "kidney";
  // Sales-facing short tip
  hint?: string;
}

export const LAB_FIELDS: LabFieldSpec[] = [
  {
    key: "systolic",
    label: "收缩压（高压）",
    unit: "mmHg",
    placeholder: "例：120",
    normal: "< 120 最佳 / < 140 可接受",
    section: "bp",
  },
  {
    key: "diastolic",
    label: "舒张压（低压）",
    unit: "mmHg",
    placeholder: "例：80",
    normal: "< 80 最佳 / < 90 可接受",
    section: "bp",
  },
  {
    key: "fpg",
    label: "空腹血糖（FPG）",
    unit: "mmol/L",
    placeholder: "例：5.5",
    normal: "3.9 – 6.0 正常",
    section: "sugar",
  },
  {
    key: "hba1c",
    label: "糖化血红蛋白（HbA1c）",
    unit: "%",
    placeholder: "例：5.5",
    normal: "< 5.7 正常",
    section: "sugar",
  },
  {
    key: "creatinine",
    label: "血清肌酐（Creatinine）",
    unit: "μmol/L",
    placeholder: "男 62–106 / 女 44–80",
    normal: "男 62–106 / 女 44–80",
    section: "kidney",
    hint: "用于自动计算 eGFR 与 CKD 分期",
  },
  {
    key: "urea",
    label: "尿素（Urea / BUN）",
    unit: "mmol/L",
    placeholder: "例：5.0",
    normal: "2.5 – 7.5",
    section: "kidney",
  },
  {
    key: "uricAcid",
    label: "尿酸（Uric Acid）",
    unit: "μmol/L",
    placeholder: "男 < 420 / 女 < 360",
    normal: "男 < 420 / 女 < 360",
    section: "kidney",
  },
];

// Section meta
export const LAB_SECTIONS: { key: "bp" | "sugar" | "kidney"; title: string; icon: string }[] = [
  { key: "bp", title: "血压", icon: "❤️" },
  { key: "sugar", title: "血糖", icon: "🩸" },
  { key: "kidney", title: "肾脏功能", icon: "🫘" },
];

// ─── Range checks (returns risk level + label) ─────────────────────
export type LabCheck = { level: RiskLevel; label: string };

export function checkSystolic(v?: number): LabCheck {
  if (!v) return { level: "unknown", label: "—" };
  if (v >= 160) return { level: "high", label: "二级高血压" };
  if (v >= 140) return { level: "high", label: "一级高血压" };
  if (v >= 130) return { level: "medium", label: "正常偏高" };
  if (v < 120) return { level: "low", label: "理想" };
  return { level: "low", label: "正常" };
}

export function checkDiastolic(v?: number): LabCheck {
  if (!v) return { level: "unknown", label: "—" };
  if (v >= 100) return { level: "high", label: "二级高血压" };
  if (v >= 90) return { level: "high", label: "一级高血压" };
  if (v >= 85) return { level: "medium", label: "正常偏高" };
  if (v < 80) return { level: "low", label: "理想" };
  return { level: "low", label: "正常" };
}

export function checkFPG(v?: number): LabCheck {
  if (!v) return { level: "unknown", label: "—" };
  if (v >= 7.0) return { level: "high", label: "糖尿病范围" };
  if (v >= 6.1) return { level: "medium", label: "前驱糖尿病" };
  if (v < 3.9) return { level: "medium", label: "偏低" };
  return { level: "low", label: "正常" };
}

export function checkHbA1c(v?: number): LabCheck {
  if (!v) return { level: "unknown", label: "—" };
  if (v >= 6.5) return { level: "high", label: "糖尿病范围" };
  if (v >= 5.7) return { level: "medium", label: "前驱糖尿病" };
  return { level: "low", label: "正常" };
}

export function checkCreatinine(v?: number, gender?: Gender): LabCheck {
  if (!v) return { level: "unknown", label: "—" };
  const upper = gender === "female" ? 80 : 106;
  const lower = gender === "female" ? 44 : 62;
  if (v > upper * 1.5) return { level: "high", label: "显著偏高" };
  if (v > upper) return { level: "high", label: "偏高" };
  if (v < lower) return { level: "medium", label: "偏低" };
  return { level: "low", label: "正常" };
}

export function checkUrea(v?: number): LabCheck {
  if (!v) return { level: "unknown", label: "—" };
  if (v > 11) return { level: "high", label: "显著偏高" };
  if (v > 7.5) return { level: "high", label: "偏高" };
  if (v < 2.5) return { level: "medium", label: "偏低" };
  return { level: "low", label: "正常" };
}

export function checkUricAcid(v?: number, gender?: Gender): LabCheck {
  if (!v) return { level: "unknown", label: "—" };
  const upper = gender === "female" ? 360 : 420;
  if (v > upper * 1.3) return { level: "high", label: "显著偏高" };
  if (v > upper) return { level: "high", label: "偏高（痛风风险）" };
  return { level: "low", label: "正常" };
}

// ─── eGFR helper ───────────────────────────────────────────────
export interface EGFRResult {
  egfr: number;
  stage: string;
  label: string;
  risk: RiskLevel;
}

export function computeEGFR(
  lab: LabValues,
  age: number,
  gender: Gender
): EGFRResult | null {
  if (!lab.creatinine || !age) return null;
  const egfr = calculateEGFR(lab.creatinine, age, gender);
  if (!egfr) return null;
  const stage = getCKDStage(egfr);
  return {
    egfr,
    stage: stage.stage,
    label: stage.label,
    risk: stage.risk,
  };
}

// ─── Helper: check if any value provided (to know whether to render anything) ───
export function hasAnyLabValue(lab: LabValues | undefined | null): boolean {
  if (!lab) return false;
  return (
    !!lab.systolic ||
    !!lab.diastolic ||
    !!lab.fpg ||
    !!lab.hba1c ||
    !!lab.creatinine ||
    !!lab.urea ||
    !!lab.uricAcid
  );
}

// ─── Bundle for AI prompt + PDF: which values, what category, what label ────
export function summarizeLabs(lab: LabValues, gender: Gender) {
  return LAB_FIELDS.map((f) => {
    const v = lab[f.key];
    if (v === undefined || v === null || Number.isNaN(v)) return null;
    let check: LabCheck = { level: "unknown", label: "" };
    switch (f.key) {
      case "systolic":
        check = checkSystolic(v);
        break;
      case "diastolic":
        check = checkDiastolic(v);
        break;
      case "fpg":
        check = checkFPG(v);
        break;
      case "hba1c":
        check = checkHbA1c(v);
        break;
      case "creatinine":
        check = checkCreatinine(v, gender);
        break;
      case "urea":
        check = checkUrea(v);
        break;
      case "uricAcid":
        check = checkUricAcid(v, gender);
        break;
    }
    return {
      key: f.key,
      label: f.label,
      value: v,
      unit: f.unit,
      normal: f.normal,
      check,
    };
  }).filter(Boolean) as Array<{
    key: LabFieldKey;
    label: string;
    value: number;
    unit: string;
    normal: string;
    check: LabCheck;
  }>;
}
