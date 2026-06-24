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
    <div className="mt-3 border-t border-[#2b251c] pt-3">
      {!prompt ? (
        <button onClick={gerar} className="btn-primary">
          Montar prompt do currículo
        </button>
      ) : (
        <div>
          <p className="text-xs text-stone-400 mb-2">
            Copie o prompt abaixo e cole no{" "}
            <a
              href="https://claude.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 underline"
            >
              Claude
            </a>{" "}
            para gerar o currículo sob medida para esta vaga.
          </p>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-stone-500">Prompt pronto</span>
            <button onClick={() => copiar(prompt)} className="text-xs text-amber-400 hover:text-amber-300">
              {copiado ? "Copiado" : "Copiar prompt"}
            </button>
          </div>
          <pre className="text-xs text-stone-300 whitespace-pre-wrap bg-[#16130e] border border-[#2b251c] rounded-lg p-3 max-h-96 overflow-y-auto font-sans">
            {prompt}
          </pre>
        </div>
      )}
    </div>
  );
}
