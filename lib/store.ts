"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Registration,
  AnalysisResult,
  SymptomAnswer,
} from "./types";
import type { LabValues } from "./lab-values";

interface State {
  registration: Registration | null;
  // questionId -> answer
  answers: Record<string, SymptomAnswer>;
  labValues: LabValues;
  currentQuestionIndex: number;
  analysisResult?: AnalysisResult;

  setRegistration: (r: Registration) => void;
  setAnswer: (questionId: string, a: SymptomAnswer) => void;
  setLabValue: (key: keyof LabValues, value: number | undefined) => void;
  setCurrentIndex: (i: number) => void;
  setAnalysisResult: (r: AnalysisResult | undefined) => void;
  reset: () => void;
}

export const useHealthStore = create<State>()(
  persist(
    (set) => ({
      registration: null,
      answers: {},
      labValues: {},
      currentQuestionIndex: 0,

      setRegistration: (r) => set({ registration: r }),

      setAnswer: (questionId, a) =>
        set((s) => ({ answers: { ...s.answers, [questionId]: a } })),

      setLabValue: (key, value) =>
        set((s) => {
          const next = { ...s.labValues };
          if (value === undefined || Number.isNaN(value)) {
            delete next[key];
          } else {
            next[key] = value;
          }
          return { labValues: next };
        }),

      setCurrentIndex: (i) => set({ currentQuestionIndex: i }),

      setAnalysisResult: (r) => set({ analysisResult: r }),

      reset: () =>
        set({
          registration: null,
          answers: {},
          labValues: {},
          currentQuestionIndex: 0,
          analysisResult: undefined,
        }),
    }),
    { name: "goherb-health-store-v3" }
  )
);
