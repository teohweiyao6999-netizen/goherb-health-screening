import { NextResponse } from "next/server";
import { buildPdfBuffer } from "@/lib/pdf-generator";
import type { Registration, AnalysisResult, SymptomAnswer } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Body {
  registration: Registration;
  answers: Record<string, SymptomAnswer>;
  result: AnalysisResult;
}

function safeFilenamePart(s: string): string {
  return s.replace(/[\\/:*?"<>|\s]+/g, "_").slice(0, 40);
}

function timestampStr(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}`;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  if (!body.registration || !body.result) {
    return NextResponse.json({ error: "缺少注册或分析数据" }, { status: 400 });
  }

  try {
    const pdf = await buildPdfBuffer(body);

    const name = safeFilenamePart(body.registration.name) || "client";
    const phone = safeFilenamePart(body.registration.phone) || "nophone";
    const filename = `GoHerb_${name}_${phone}_${timestampStr()}.pdf`;

    // Stream PDF as a download response (works on Vercel + local)
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Length": pdf.length.toString(),
      },
    });
  } catch (e) {
    console.error("save-report error:", e);
    const message = e instanceof Error ? e.message : "PDF 生成失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
