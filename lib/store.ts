"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Registration,
  AnalysisResult,
  SymptomAnswer,
} from "./types";

interface State {
  registration: Registration | null;
  // questionId -> answer
  answers: Record<string, SymptomAnswer>;
  currentQuestionIndex: number;
  analysisResult?: AnalysisResult;

  setRegistration: (r: Registration) => void;
  setAnswer: (questionId: string, a: SymptomAnswer) => void;
  setCurrentIndex: (i: number) => void;
  setAnalysisResult: (r: AnalysisResult | undefined) => void;
  reset: () => void;
}

export const useHealthStore = create<State>()(
  persist(
    (set) => ({
      registration: null,
      answers: {},
      currentQuestionIndex: 0,

      setRegistration: (r) => set({ registration: r }),

      setAnswer: (questionId, a) =>
        set((s) => ({ answers: { ...s.answers, [questionId]: a } })),

      setCurrentIndex: (i) => set({ currentQuestionIndex: i }),

      setAnalysisResult: (r) => set({ analysisResult: r }),

      reset: () =>
        set({
          registration: null,
          answers: {},
          currentQuestionIndex: 0,
          analysisResult: undefined,
        }),
    }),
    { name: "goherb-health-store-v2" }
  )
);
