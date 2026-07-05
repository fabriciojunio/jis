import { describe, it, expect, vi, afterEach } from "vitest";
import { importFromGithub } from "./github";

// A validação acontece ANTES de qualquer fetch; garantimos que a rede não é
// tocada quando a entrada é inválida.
afterEach(() => vi.restoreAllMocks());

describe("importFromGithub — validação de entrada", () => {
  it("rejeita usuário vazio", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    await expect(importFromGithub("   ")).rejects.toThrow(/Informe o usuário/);
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejeita usuário com caracteres inválidos sem chamar a rede", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    await expect(importFromGithub("usuario inválido!")).rejects.toThrow(/inválido/);
    await expect(importFromGithub("-comeca-com-hifen")).rejects.toThrow(/inválido/);
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejeita token com caracteres perigosos (anti header injection)", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    await expect(importFromGithub("fabriciojunio", "tok\r\nX-Injected: 1")).rejects.toThrow(
      /Token do GitHub inválido/
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it("extrai o usuário de uma URL completa do GitHub", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 })
    );
    await importFromGithub("https://github.com/fabriciojunio/");
    expect(spy).toHaveBeenCalledOnce();
    const url = String(spy.mock.calls[0][0]);
    expect(url).toContain("/users/fabriciojunio/repos");
  });
});
