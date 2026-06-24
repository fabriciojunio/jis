import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildCvPrompt } from "@/lib/cv-prompt";
import type { Job } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Gera um currículo sob medida para a vaga usando a API da Claude.
 * Sem ANTHROPIC_API_KEY configurada, devolve o prompt pronto para o usuário
 * copiar e colar no Claude — a feature funciona dos dois jeitos.
 */
export async function POST(req: NextRequest) {
  let job: Job;
  try {
    job = (await req.json()) as Job;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!job?.title) {
    return NextResponse.json({ error: "Vaga inválida" }, { status: 400 });
  }

  const prompt = buildCvPrompt(job);
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Sem chave: a geração automática ainda não está disponível.
  // Avisa que está sem token e que é para aguardar a configuração.
  if (!apiKey) {
    return NextResponse.json({
      mode: "no-token",
      message:
        "Sem token da Claude configurado. A geração automática de currículo ficará disponível assim que o token for adicionado. Aguarde a configuração.",
      prompt,
    });
  }

  try {
    const client = new Anthropic({ apiKey });
    const model = process.env.JIS_CV_MODEL || "claude-opus-4-8";
    const message = await client.messages.create({
      model,
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });
    const cv = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();

    return NextResponse.json({ mode: "generated", cv, model });
  } catch (e) {
    // Falhou a API: ainda assim entrega o prompt para o usuário não ficar sem nada.
    return NextResponse.json({
      mode: "prompt",
      prompt,
      error: e instanceof Error ? e.message : "Falha ao gerar com IA",
    });
  }
}
