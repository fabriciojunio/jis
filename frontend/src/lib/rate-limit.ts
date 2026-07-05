/**
 * Rate limiting best-effort em memória (janela deslizante por IP).
 *
 * Limitação honesta: em ambiente serverless (Vercel) cada instância tem sua
 * própria memória, então o teto é aplicado por instância, não globalmente. Para
 * um teto forte e distribuído seria preciso um store compartilhado (ex.: Redis /
 * Upstash). Ainda assim, isto já contém abuso trivial e rajadas de um mesmo IP,
 * protegendo a rota que dispara fetches para fontes externas (amplificação).
 */

interface Registro {
  count: number;
  reset: number;
}

const balde = new Map<string, Registro>();

export interface ResultadoLimite {
  ok: boolean;
  restante: number;
  resetEmSeg: number;
}

export function rateLimit(
  chave: string,
  limite = 30,
  janelaMs = 60_000
): ResultadoLimite {
  const agora = Date.now();
  const reg = balde.get(chave);

  if (!reg || agora > reg.reset) {
    balde.set(chave, { count: 1, reset: agora + janelaMs });
    return { ok: true, restante: limite - 1, resetEmSeg: Math.ceil(janelaMs / 1000) };
  }

  reg.count += 1;
  const resetEmSeg = Math.max(0, Math.ceil((reg.reset - agora) / 1000));
  if (reg.count > limite) return { ok: false, restante: 0, resetEmSeg };
  return { ok: true, restante: limite - reg.count, resetEmSeg };
}

/** Evita crescimento ilimitado do Map quando há muitos IPs distintos. */
function limparExpirados() {
  const agora = Date.now();
  for (const [k, v] of balde) if (agora > v.reset) balde.delete(k);
}

// Limpeza periódica leve (não bloqueia o event loop no shutdown).
const timer = setInterval(limparExpirados, 5 * 60_000);
if (typeof timer === "object" && "unref" in timer) timer.unref();
