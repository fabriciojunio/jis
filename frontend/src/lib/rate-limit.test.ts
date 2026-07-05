import { describe, it, expect } from "vitest";
import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  it("libera dentro do teto e bloqueia ao exceder", () => {
    const chave = `teste:${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(chave, 3, 60_000).ok).toBe(true);
    }
    const estourado = rateLimit(chave, 3, 60_000);
    expect(estourado.ok).toBe(false);
    expect(estourado.restante).toBe(0);
    expect(estourado.resetEmSeg).toBeGreaterThan(0);
  });

  it("reseta após a janela expirar", async () => {
    const chave = `teste:${Math.random()}`;
    expect(rateLimit(chave, 1, 10).ok).toBe(true);
    expect(rateLimit(chave, 1, 10).ok).toBe(false);
    await new Promise((r) => setTimeout(r, 15));
    expect(rateLimit(chave, 1, 10).ok).toBe(true);
  });

  it("chaves distintas não interferem", () => {
    expect(rateLimit(`a:${Math.random()}`, 1).ok).toBe(true);
    expect(rateLimit(`b:${Math.random()}`, 1).ok).toBe(true);
  });
});
