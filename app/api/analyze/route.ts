import Anthropic from "@anthropic-ai/sdk";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import { NextResponse } from "next/server";
import {
  SYSTEM_PROMPT,
  buildPrompt,
  type AnalyzeInput,
} from "@/lib/prompt-builder";
import { ALL_CITATION_KEYS } from "@/lib/citations";

export const runtime = "nodejs";
// Vercel Pro allows up to 300s. Opus 4.7 with detailed output finishes 30-60s.
export const maxDuration = 300;

// Opus 4.7 — highest quality for detailed health analysis.
// Now that we're on Vercel Pro (300s function timeout), we can afford Opus.
const MODEL = "claude-opus-4-7";

const SYSTEM_SCHEMA = {
  type: "object",
  properties: {
    risk: { type: "string", enum: ["low", "medium", "high"] },
    visualMetaphor: {
      type: "string",
      description:
        "一句话画面感比喻，例如「肾就像家里的滤水器，已经在堵塞」",
    },
    paragraph: {
      type: "string",
      description:
        "150-250 字的详细段落。马来华语白话。必须引用 3 个以上用户回答（**粗体** 包起来）+ 解释生理机制 + 引用化验数值（如有）+ 提及拖延时间。销售员要讲 1 分钟以上，必须有干货。不可少于 150 字。",
    },
    causeEffect: {
      type: "string",
      description:
        "20-40 字的一句话因果结论。引用红灯答案，讲清「这几个加起来 → 生理后果」。",
    },
    riskExplanation: {
      type: "string",
      description:
        "60-100 字。解释这个风险继续下去身体会发生什么。合规语言：不诊断、不预测「会得 X 病」。但要画面感强，让用户感受到不能拖。范例：'肾脏的滤网（肾小球）一旦受损就不可逆。早期症状轻，等到 eGFR 跌破 60，毒素就开始堆积。继续重口味 + 长期吃止痛药，等同每天逼肾加班。'",
    },
    recommendation: {
      type: "string",
      description: "一句话明确建议下一步行动",
    },
    citationKey: {
      type: "string",
      enum: ALL_CITATION_KEYS,
      description:
        "从 citation 库里选一个最贴切的 key，作为科学依据。必须从枚举值里选，不可以编造。",
    },
  },
  required: [
    "risk",
    "visualMetaphor",
    "paragraph",
    "causeEffect",
    "riskExplanation",
    "recommendation",
    "citationKey",
  ],
};

const ANALYSIS_TOOL: Tool = {
  name: "submit_health_analysis",
  description: "Submit the structured health risk analysis result.",
  input_schema: {
    type: "object",
    properties: {
      overallRisk: { type: "string", enum: ["low", "medium", "high"] },
      overallScore: {
        type: "number",
        description: "0–100 整体风险评分，分数越高风险越大",
      },
      systems: {
        type: "object",
        properties: {
          blood_pressure: SYSTEM_SCHEMA,
          blood_sugar: SYSTEM_SCHEMA,
          lipids: SYSTEM_SCHEMA,
          kidney: SYSTEM_SCHEMA,
        },
      },
      topConcerns: { type: "array", items: { type: "string" } },
      immediateActions: { type: "array", items: { type: "string" } },
      lifestyleAdvice: { type: "array", items: { type: "string" } },
      followUpAdvice: { type: "string" },
      disclaimer: { type: "string" },
    },
    required: [
      "overallRisk",
      "overallScore",
      "systems",
      "topConcerns",
      "immediateActions",
      "lifestyleAdvice",
      "followUpAdvice",
      "disclaimer",
    ],
  },
};

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY 未配置" },
      { status: 500 }
    );
  }

  let body: AnalyzeInput;
  try {
    body = (await req.json()) as AnalyzeInput;
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const userPrompt = buildPrompt(body);
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 12000,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [ANALYSIS_TOOL],
      tool_choice: { type: "tool", name: ANALYSIS_TOOL.name },
      messages: [{ role: "user", content: userPrompt }],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      console.error("AI did not return tool_use. stop_reason:", response.stop_reason);
      console.error("content:", JSON.stringify(response.content, null, 2));
      return NextResponse.json(
        { error: "AI 没有返回结构化结果" },
        { status: 502 }
      );
    }

    return NextResponse.json(toolUse.input);
  } catch (e) {
    console.error("Analyze error:", e);
    const message = e instanceof Error ? e.message : "AI 调用失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
