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
export const maxDuration = 60;

const MODEL = "claude-sonnet-4-6";

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
        "2-4 句话的简洁段落，马来华语白话。引用用户具体的回答（用 **粗体** 包起来），让销售员读出来时听起来是基于客户的回复。例如：'你刚才说 **尿泡 3 分钟还散不掉**，加上 **夜尿 3 次**，这两个都是肾小球开始受损的早期信号。'",
    },
    causeEffect: {
      type: "string",
      description:
        "一句话因果结论，给「为什么是这个结果」区块用。要点：引用用户的红灯答案，讲清这几个答案合起来代表什么。例如：'尿泡多 + 夜尿频繁 + 腰酸，这 3 个加起来，是肾小球过滤功能开始下降的典型组合。' 低风险时写正面版：'这几项你都答得不错，代表肾脏目前的过滤功能还稳定。'",
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
      max_tokens: 4000,
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
