import type { Gender } from "./types";

export function calculateBMI(heightCm: number, weightKg: number): number {
  if (!heightCm || !weightKg) return 0;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "体重过轻";
  if (bmi < 23) return "正常";
  if (bmi < 25) return "超重";
  if (bmi < 30) return "肥胖一级";
  return "肥胖二级以上";
}

// CKD-EPI 2021 (race-free)
export function calculateEGFR(
  creatinineUmolL: number,
  age: number,
  gender: Gender
): number {
  if (!creatinineUmolL || !age) return 0;
  const crMgDl = creatinineUmolL / 88.4;
  const kappa = gender === "female" ? 0.7 : 0.9;
  const alpha = gender === "female" ? -0.241 : -0.302;
  const ratio = crMgDl / kappa;
  const min = Math.min(ratio, 1);
  const max = Math.max(ratio, 1);
  let egfr = 142 * Math.pow(min, alpha) * Math.pow(max, -1.2) * Math.pow(0.9938, age);
  if (gender === "female") egfr *= 1.012;
  return Math.round(egfr);
}

export function getCKDStage(egfr: number): { label: string; stage: string; risk: "low" | "medium" | "high" } {
  if (egfr >= 90) return { label: "G1 – 正常", stage: "1", risk: "low" };
  if (egfr >= 60) return { label: "G2 – 轻度下降", stage: "2", risk: "low" };
  if (egfr >= 45) return { label: "G3a – 轻中度下降", stage: "3a", risk: "medium" };
  if (egfr >= 30) return { label: "G3b – 中重度下降", stage: "3b", risk: "high" };
  if (egfr >= 15) return { label: "G4 – 重度下降", stage: "4", risk: "high" };
  return { label: "G5 – 肾衰竭", stage: "5", risk: "high" };
}

// Quick range checker for live UI feedback
export function checkBloodPressure(systolic: number, diastolic: number) {
  if (!systolic || !diastolic) return { level: "unknown" as const, label: "—" };
  if (systolic >= 160 || diastolic >= 100) return { level: "high" as const, label: "二级高血压" };
  if (systolic >= 140 || diastolic >= 90) return { level: "high" as const, label: "一级高血压" };
  if (systolic >= 130 || diastolic >= 85) return { level: "medium" as const, label: "正常偏高" };
  if (systolic < 120 && diastolic < 80) return { level: "low" as const, label: "理想血压" };
  return { level: "low" as const, label: "正常" };
}

export function checkFastingGlucose(value: number) {
  if (!value) return { level: "unknown" as const, label: "—" };
  if (value >= 7.0) return { level: "high" as const, label: "糖尿病范围" };
  if (value >= 6.1) return { level: "medium" as const, label: "前驱糖尿病" };
  if (value >= 3.9) return { level: "low" as const, label: "正常" };
  return { level: "medium" as const, label: "偏低" };
}

export function checkHbA1c(value: number) {
  if (!value) return { level: "unknown" as const, label: "—" };
  if (value >= 6.5) return { level: "high" as const, label: "糖尿病范围" };
  if (value >= 5.7) return { level: "medium" as const, label: "前驱糖尿病" };
  return { level: "low" as const, label: "正常" };
}
