"use client";

import { useState } from "react";
import type { Job } from "@/lib/types";

/**
 * Painel de geração de currículo. Chama /api/cv: se houver chave da Claude
 * configurada, mostra o currículo pronto; senão, mostra o prompt para copiar
 * e gerar no Claude/Claude Code.
 */
export function CvPanel({ job, onGenerated }: { job: Job; onGenerated?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [cv, setCv] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [semToken, setSemToken] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function gerar() {
    setLoading(true);
    setErro(null);
    setCv(null);
    setPrompt(null);
    setSemToken(null);
    try {
      const res = await fetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job),
      });
      const data = await res.json();
      if (data.mode === "generated") {
        setCv(data.cv);
        if (data.error) setErro(data.error);
      } else if (data.mode === "no-token") {
        setSemToken(data.message);
        setPrompt(data.prompt);
      } else {
        setPrompt(data.prompt);
        if (data.error) setErro(data.error);
      }
      onGenerated?.();
    } catch {
      setErro("Não foi possível contactar o servidor.");
    } finally {
      setLoading(false);
    }
  }

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setErro("Não foi possível copiar.");
    }
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      {!cv && !prompt && !semToken && (
        <button
          onClick={gerar}
          disabled={loading}
          className="text-sm font-semibold bg-[#0f3460] text-white px-3 py-1.5 rounded-lg hover:bg-[#1a1a2e] transition-colors disabled:opacity-60"
        >
          {loading ? "Gerando..." : "Gerar currículo para esta vaga"}
        </button>
      )}

      {semToken && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-800 flex items-start gap-2">
          <span>⏳</span>
          <span>{semToken}</span>
        </div>
      )}

      {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}

      {cv && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-500">Currículo gerado</span>
            <button onClick={() => copiar(cv)} className="text-xs text-[#0f3460] hover:underline">
              {copiado ? "Copiado!" : "Copiar"}
            </button>
          </div>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 max-h-96 overflow-y-auto font-sans">
            {cv}
          </pre>
        </div>
      )}

      {prompt && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-1">
            {semToken
              ? "Enquanto isso, você pode copiar o prompt e gerar o currículo manualmente no Claude:"
              : "Copie o prompt abaixo e cole no Claude para gerar o currículo:"}
          </p>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-500">Prompt pronto</span>
            <button onClick={() => copiar(prompt)} className="text-xs text-[#0f3460] hover:underline">
              {copiado ? "Copiado!" : "Copiar prompt"}
            </button>
          </div>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 max-h-96 overflow-y-auto font-sans">
            {prompt}
          </pre>
        </div>
      )}
    </div>
  );
}
