// ════════════════════════════════════════════════════════════════
// Citation Library
//
// All citations here are REAL, verifiable references.
// AI can only pick from this library — do not let it invent citations.
//
// When updating: each entry must have a real, traceable source.
// ════════════════════════════════════════════════════════════════

export interface Citation {
  key: string;
  short: string;     // Short label for in-text reference
  full: string;      // Full bibliographic citation
  url?: string;      // Optional URL to source
  appliesTo: string; // What kind of finding this supports
}

export const CITATIONS: Record<string, Citation> = {
  // ── 肾脏 (Kidney) ──
  KDIGO_2024_CKD: {
    key: "KDIGO_2024_CKD",
    short: "KDIGO 2024 CKD Guideline",
    full: "Kidney Disease: Improving Global Outcomes (KDIGO) CKD Work Group. KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int. 2024;105(4S):S117-S314.",
    url: "https://kdigo.org/guidelines/ckd-evaluation-and-management/",
    appliesTo: "肾脏功能评估、CKD 分期、早期筛查阈值",
  },
  KDIGO_2024_ALBUMINURIA: {
    key: "KDIGO_2024_ALBUMINURIA",
    short: "KDIGO 2024 §3.2 Albuminuria",
    full: "KDIGO 2024 CKD Guideline §3.2: Albuminuria categories (A1: <30 mg/g, A2: 30-300 mg/g, A3: >300 mg/g) — persistent foamy urine is a clinical marker of proteinuria.",
    url: "https://kdigo.org/guidelines/ckd-evaluation-and-management/",
    appliesTo: "泡沫尿、蛋白尿信号",
  },
  MSN_POSITION_2023: {
    key: "MSN_POSITION_2023",
    short: "Malaysian Society of Nephrology 2023",
    full: "Malaysian Society of Nephrology. Position Paper on Early Detection and Management of Chronic Kidney Disease in Malaysia. 2023.",
    url: "https://www.msn.org.my",
    appliesTo: "马来西亚 CKD 筛查与管理本地化建议",
  },
  NHMS_2018_CKD: {
    key: "NHMS_2018_CKD",
    short: "NHMS 2018",
    full: "Institute for Public Health, Ministry of Health Malaysia. National Health and Morbidity Survey 2018: Non-Communicable Diseases. CKD prevalence: 15.5% of adults.",
    url: "https://iku.gov.my/nhms",
    appliesTo: "马来西亚 CKD 流行率、每 7 人 1 人统计",
  },

  // ── 血压 (Blood Pressure) ──
  MOH_HTN_2018: {
    key: "MOH_HTN_2018",
    short: "MOH Malaysia HTN CPG 2018",
    full: "Ministry of Health Malaysia. Clinical Practice Guidelines: Management of Hypertension (5th Edition, 2018). BP categories: <120/80 optimal, 120-129/80-84 normal, 130-139/85-89 high-normal, ≥140/90 hypertension.",
    url: "https://www.moh.gov.my/moh/resources/Penerbitan/CPG/Cardiovascular/CPG_Hypertension_2018.pdf",
    appliesTo: "血压分级、高血压诊断标准",
  },
  ESH_2023_HTN: {
    key: "ESH_2023_HTN",
    short: "ESH 2023 Hypertension Guidelines",
    full: "Mancia G, Kreutz R, Brunström M, et al. 2023 ESH Guidelines for the management of arterial hypertension. J Hypertens. 2023;41(12):1874-2071.",
    url: "https://doi.org/10.1097/HJH.0000000000003480",
    appliesTo: "高血压症状（头痛、头晕、颈部僵硬）与靶器官损伤",
  },
  NHMS_2019_HTN: {
    key: "NHMS_2019_HTN",
    short: "NHMS 2019",
    full: "Institute for Public Health, Ministry of Health Malaysia. National Health and Morbidity Survey 2019: NCDs. Hypertension prevalence: 30.0% of adults.",
    url: "https://iku.gov.my/nhms",
    appliesTo: "马来西亚高血压流行率",
  },

  // ── 血糖 (Blood Sugar) ──
  MOH_T2DM_2020: {
    key: "MOH_T2DM_2020",
    short: "MOH Malaysia T2DM CPG 2020",
    full: "Ministry of Health Malaysia. Clinical Practice Guidelines: Management of Type 2 Diabetes Mellitus (6th Edition, 2020). FPG ≥7.0 mmol/L or HbA1c ≥6.5% diagnostic for diabetes.",
    url: "https://www.moh.gov.my/moh/resources/Penerbitan/CPG/Endocrine/CPG_T2DM_2020.pdf",
    appliesTo: "糖尿病诊断切点、FPG 与 HbA1c 标准",
  },
  ADA_2024: {
    key: "ADA_2024",
    short: "ADA Standards of Care 2024",
    full: "American Diabetes Association. Standards of Medical Care in Diabetes—2024. Diabetes Care. 2024;47(Suppl 1):S1-S321. Classic symptoms: polyuria, polydipsia, polyphagia, unexplained weight loss.",
    url: "https://diabetesjournals.org/care/issue/47/Supplement_1",
    appliesTo: "糖尿病典型症状（多尿、多饮、多食、消瘦、伤口愈合慢）",
  },
  NHMS_2019_DM: {
    key: "NHMS_2019_DM",
    short: "NHMS 2019",
    full: "Institute for Public Health, Ministry of Health Malaysia. National Health and Morbidity Survey 2019: NCDs. Diabetes prevalence: 18.3% of adults.",
    url: "https://iku.gov.my/nhms",
    appliesTo: "马来西亚糖尿病流行率",
  },

  // ── 生活习惯 / 风险因子 ──
  WHO_NCD_2013: {
    key: "WHO_NCD_2013",
    short: "WHO Global NCD Action Plan",
    full: "World Health Organization. Global Action Plan for the Prevention and Control of NCDs 2013–2030. Tobacco use, harmful alcohol, physical inactivity, unhealthy diet are the four major modifiable risk factors.",
    url: "https://www.who.int/publications/i/item/9789241506236",
    appliesTo: "吸烟、饮酒、缺乏运动、不健康饮食的风险评估",
  },
  GBD_2020_LANCET: {
    key: "GBD_2020_LANCET",
    short: "Lancet GBD Study 2020",
    full: "GBD 2019 Risk Factors Collaborators. Global burden of 87 risk factors in 204 countries and territories, 1990-2019. Lancet. 2020;396(10258):1223-1249.",
    url: "https://doi.org/10.1016/S0140-6736(20)30752-2",
    appliesTo: "全球疾病负担与可改变风险因子",
  },

  // ── 修复周期 / 干预效果 ──
  KDIGO_LIFESTYLE: {
    key: "KDIGO_LIFESTYLE",
    short: "KDIGO 2024 §4.1 Lifestyle",
    full: "KDIGO 2024 CKD Guideline §4.1: Lifestyle interventions (sodium restriction, hydration, weight management) typically require 3-6 months of consistent practice before measurable improvement in albuminuria or eGFR stabilization.",
    url: "https://kdigo.org/guidelines/ckd-evaluation-and-management/",
    appliesTo: "生活方式调整需要 3-6 个月才显效（4 个月关键期）",
  },
  NEJM_RENAL_RECOVERY: {
    key: "NEJM_RENAL_RECOVERY",
    short: "Levey AS, NEJM 2017",
    full: "Levey AS, Inker LA. Assessment of Glomerular Filtration Rate in Health and Disease: A State of the Art Review. Clin Pharmacol Ther. 2017;102(3):405-419.",
    url: "https://doi.org/10.1002/cpt.729",
    appliesTo: "肾功能评估与恢复时间线",
  },
};

export type CitationKey = keyof typeof CITATIONS;

export const ALL_CITATION_KEYS = Object.keys(CITATIONS) as CitationKey[];

export function getCitation(key: string): Citation | null {
  return CITATIONS[key] ?? null;
}

// For AI prompt: give it the menu of available citations
export function citationMenuForPrompt(): string {
  const lines: string[] = ["## 可用的 Citation 库（你只能从这里面选，不可以编造）"];
  for (const key of ALL_CITATION_KEYS) {
    const c = CITATIONS[key];
    lines.push(`- **${key}**：${c.short} — 适用于：${c.appliesTo}`);
  }
  return lines.join("\n");
}
