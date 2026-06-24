"use client";

import { useState } from "react";
import type { Job } from "@/lib/types";
import { buildCvPrompt } from "@/lib/cv-prompt";

/**
 * Painel de currículo. Monta um prompt completo com os dados da vaga + o perfil
 * do candidato. Basta copiar e colar no Claude (claude.ai) para gerar o
 * currículo sob medida — sem custo e sem configuração.
 */
export function CvPanel({ job, onGenerated }: { job: Job; onGenerated?: () => void }) {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  function gerar() {
    setPrompt(buildCvPrompt(job));
    onGenerated?.();
  }

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // navegador sem permissão de clipboard: o usuário pode selecionar manualmente
    }
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      {!prompt ? (
        <button
          onClick={gerar}
          className="text-sm font-semibold bg-[#0f3460] text-white px-3 py-1.5 rounded-lg hover:bg-[#1a1a2e] transition-colors"
        >
          Montar prompt do currículo
        </button>
      ) : (
        <div>
          <p className="text-xs text-gray-500 mb-1">
            Copie o prompt abaixo e cole no{" "}
            <a
              href="https://claude.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0f3460] underline"
            >
              Claude
            </a>{" "}
            para gerar o currículo sob medida para esta vaga.
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
