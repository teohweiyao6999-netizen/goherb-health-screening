"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useHealthStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const setRegistration = useHealthStore((s) => s.setRegistration);
  const reset = useHealthStore((s) => s.reset);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [consent, setConsent] = useState(false);

  const phoneClean = phone.replace(/\D/g, "");
  const ageNum = typeof age === "number" ? age : parseInt(age || "0");

  const valid =
    name.trim().length >= 2 &&
    phoneClean.length >= 9 &&
    ageNum >= 18 &&
    ageNum <= 120 &&
    consent;

  const handleSubmit = () => {
    if (!valid) return;
    // Reset previous answers before starting fresh
    reset();
    setRegistration({
      name: name.trim(),
      phone: phoneClean,
      age: ageNum,
      gender,
      consent: true,
      registeredAt: new Date().toISOString(),
    });
    router.push("/quiz");
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <button
        type="button"
        onClick={() => router.push("/")}
        className="mb-3 text-base text-slate-500 underline"
      >
        ← 返回首页
      </button>
      <h1 className="text-3xl font-bold text-slate-900">先填几个简单资料</h1>
      <p className="mt-2 text-lg text-slate-600">
        我们要这些资料来生成你的个人化报告。
      </p>

      <div className="mt-8 space-y-6 rounded-2xl border-2 border-slate-200 bg-white p-6">
        <Field label="姓名">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：陈伟豪"
            className="h-14 w-full rounded-xl border-2 border-slate-300 px-4 text-xl focus:border-emerald-500 focus:outline-none"
          />
        </Field>

        <Field label="WhatsApp 号码">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="例如：60123456789"
            className="h-14 w-full rounded-xl border-2 border-slate-300 px-4 text-xl focus:border-emerald-500 focus:outline-none"
          />
          <p className="mt-1 text-sm text-slate-500">
            包括国家代码（马来西亚是 60）
          </p>
        </Field>

        <Field label="年龄">
          <input
            type="number"
            inputMode="numeric"
            value={age}
            onChange={(e) =>
              setAge(e.target.value === "" ? "" : parseInt(e.target.value))
            }
            placeholder="例如：55"
            className="h-14 w-full rounded-xl border-2 border-slate-300 px-4 text-xl focus:border-emerald-500 focus:outline-none"
          />
        </Field>

        <div>
          <div className="mb-3 text-lg font-medium text-slate-700">性别</div>
          <div className="grid grid-cols-2 gap-3">
            {(["male", "female"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={cn(
                  "min-h-[56px] rounded-xl border-2 text-lg font-medium transition",
                  gender === g
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700"
                )}
              >
                {g === "male" ? "男" : "女"}
              </button>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-5 w-5 cursor-pointer"
          />
          <div className="text-base leading-relaxed text-slate-700">
            我同意 GoHerb 收集以上资料，仅用于生成健康风险报告。
            我了解此评估不构成医疗诊断。
          </div>
        </label>
      </div>

      <button
        type="button"
        disabled={!valid}
        onClick={handleSubmit}
        className={cn(
          "mt-8 inline-flex h-16 w-full items-center justify-center rounded-2xl text-xl font-semibold text-white transition",
          valid
            ? "bg-emerald-600 hover:bg-emerald-700"
            : "bg-slate-300"
        )}
      >
        开始评估 →
      </button>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-lg font-medium text-slate-700">{label}</div>
      {children}
    </label>
  );
}
