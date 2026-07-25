/**
 * Log estruturado mínimo (JSON em uma linha) para observabilidade em produção.
 * Sem dependências: o objetivo é ter rastros consultáveis nos logs da Vercel
 * sem vazar dados sensíveis nem stack traces para o cliente.
 */

type Nivel = "info" | "warn" | "error";

function emit(nivel: Nivel, evento: string, dados?: Record<string, unknown>) {
  const linha = JSON.stringify({
    ts: new Date().toISOString(),
    nivel,
    evento,
    ...dados,
  });
  (nivel === "error" ? console.error : nivel === "warn" ? console.warn : console.log)(linha);
}

export const log = {
  info: (evento: string, dados?: Record<string, unknown>) => emit("info", evento, dados),
  warn: (evento: string, dados?: Record<string, unknown>) => emit("warn", evento, dados),
  error: (evento: string, dados?: Record<string, unknown>) => emit("error", evento, dados),
};
