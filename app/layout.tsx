import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoHerb 健康风险筛查",
  description:
    "AI 健康风险筛查工具：肾脏 + 三高（高血压、糖尿病、高血脂）",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gradient-to-b from-emerald-50/40 to-white antialiased">
        {children}
        <footer className="mt-16 border-t border-slate-200 bg-white/80 px-4 py-8 text-center text-sm text-slate-500">
          <p className="mx-auto max-w-3xl leading-relaxed">
            本工具提供的健康风险评估仅供参考，不构成医疗诊断、治疗建议或处方。
            评估结果基于您提供的资料及公开医学指南，AI 分析存在误差可能性。
            如有任何健康疑虑，请咨询注册医生或专科医生。
          </p>
        </footer>
      </body>
    </html>
  );
}
