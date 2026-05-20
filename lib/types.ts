export type Gender = "male" | "female";

export type InputMode = "pending" | "value" | "symptoms" | "skipped";

export type RiskLevel = "low" | "medium" | "high" | "unknown";

export type SymptomFrequency = "never" | "occasional" | "frequent" | "daily";

export interface SymptomQuestion {
  id: string;
  text: string;
  options?: { label: string; value: string; score: number }[];
  module: SystemKey | "lifestyle" | "duration";
}

export interface SymptomAnswer {
  question: string;
  answer: string;
  score: number;
}

export interface Registration {
  name: string;
  phone: string;
  age: number;
  gender: Gender;
  consent: boolean;
  registeredAt: string;
}

export interface Profile {
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  bmi: number;
}

export type SystemKey =
  | "blood_pressure"
  | "blood_sugar"
  | "lipids"
  | "kidney";

export interface SystemAnalysis {
  risk: RiskLevel;
  visualMetaphor: string;
  // A short paragraph (2-4 sentences) — uses **bold** markers around key
  // phrases that quote the user's actual answers. Salesperson reads this
  // aloud to the customer.
  paragraph: string;
  // One-sentence cause-effect conclusion: quotes the user's red-flag answers
  // and explains what those answers, combined, mean. Used in WhyThisResult.
  causeEffect: string;
  // One actionable next-step recommendation
  recommendation: string;
  // The single citation key from CITATIONS library that supports this analysis
  citationKey: string;
  ckdStage?: string;
  eGFR?: number | null;
}

export interface AnalysisResult {
  overallRisk: RiskLevel;
  overallScore: number;
  systems: Partial<Record<SystemKey, SystemAnalysis>>;
  topConcerns: string[];
  immediateActions: string[];
  lifestyleAdvice: string[];
  followUpAdvice: string;
  disclaimer: string;
}

export const SYMPTOM_OPTIONS: { label: string; value: string; score: number }[] = [
  { label: "从来不会", value: "never", score: 0 },
  { label: "偶尔几次", value: "occasional", score: 1 },
  { label: "蛮常有", value: "frequent", score: 2 },
  { label: "几乎天天", value: "daily", score: 3 },
];
