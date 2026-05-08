export const GUIDELINES = {
  blood_pressure: {
    source:
      "MOH Malaysia Clinical Practice Guidelines – Management of Hypertension (5th Ed, 2018)",
    short: "MOH Malaysia HTN CPG 2018",
    url: "https://www.moh.gov.my/moh/resources/Penerbitan/CPG/Cardiovascular/CPG_Hypertension_2018.pdf",
  },
  blood_sugar: {
    source:
      "MOH Malaysia CPG – Management of Type 2 Diabetes Mellitus (6th Ed, 2020)",
    short: "MOH CPG T2DM 2020",
    url: "https://www.moh.gov.my/moh/resources/Penerbitan/CPG/Endocrine/CPG_T2DM_2020.pdf",
  },
  lipids: {
    source:
      "MEMS Clinical Practice Guidelines on the Management of Dyslipidaemia (2017)",
    short: "MEMS Dyslipidaemia CPG 2017",
    url: "",
  },
  kidney: {
    source: "KDIGO 2024 CKD Guidelines | Malaysian Society of Nephrology",
    short: "KDIGO 2024 / MSN",
    url: "",
  },
  bmi: {
    source: "WHO Asian BMI Classification | MOH Malaysia",
    short: "WHO / MOH Asian BMI",
    url: "",
  },
  waist: {
    source: "International Diabetes Federation (IDF) 2005",
    short: "IDF 2005",
    url: "",
  },
} as const;

export type GuidelineKey = keyof typeof GUIDELINES;
