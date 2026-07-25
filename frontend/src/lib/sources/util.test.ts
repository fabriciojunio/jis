import { describe, it, expect } from "vitest";
import { urlPermitida, stripHtml, parseSalary, isRemote, isHybrid, decode } from "./util";

describe("urlPermitida (barreira anti-SSRF)", () => {
  it("aceita https público", () => {
    expect(urlPermitida("https://remotive.com/api/remote-jobs")).toBe(true);
    expect(urlPermitida("https://www.linkedin.com/jobs-guest/x")).toBe(true);
  });

  it("recusa http em claro e esquemas exóticos", () => {
    expect(urlPermitida("http://remotive.com/api")).toBe(false);
    expect(urlPermitida("file:///etc/passwd")).toBe(false);
    expect(urlPermitida("ftp://example.com")).toBe(false);
    expect(urlPermitida("gopher://example.com")).toBe(false);
  });

  it("recusa loopback e faixas internas", () => {
    expect(urlPermitida("https://localhost/x")).toBe(false);
    expect(urlPermitida("https://127.0.0.1/x")).toBe(false);
    expect(urlPermitida("https://10.0.0.5/x")).toBe(false);
    expect(urlPermitida("https://192.168.1.1/x")).toBe(false);
    expect(urlPermitida("https://169.254.169.254/latest/meta-data")).toBe(false);
    expect(urlPermitida("https://172.16.0.1/x")).toBe(false);
    expect(urlPermitida("https://172.31.255.255/x")).toBe(false);
    expect(urlPermitida("https://metadata.google.internal/x")).toBe(false);
  });

  it("aceita 172 fora da faixa privada", () => {
    expect(urlPermitida("https://172.15.0.1/x")).toBe(true);
    expect(urlPermitida("https://172.32.0.1/x")).toBe(true);
  });

  it("recusa entrada malformada", () => {
    expect(urlPermitida("não é url")).toBe(false);
    expect(urlPermitida("")).toBe(false);
  });
});

describe("helpers de parsing", () => {
  it("stripHtml remove tags e decodifica entidades", () => {
    expect(stripHtml("<p>Java &amp; Node</p>")).toBe("Java & Node");
  });
  it("parseSalary extrai faixa", () => {
    expect(parseSalary("R$ 5.000 a 8.000")).toEqual({ min: 5000, max: 8000, informed: true });
    expect(parseSalary("")).toEqual({ min: null, max: null, informed: false });
  });
  it("isRemote / isHybrid detectam modo", () => {
    expect(isRemote("100% remoto")).toBe(true);
    expect(isRemote("São Paulo, presencial")).toBe(false);
    expect(isHybrid("Modelo híbrido")).toBe(true);
  });
  it("decode trata entidades básicas", () => {
    expect(decode("A &amp; B")).toBe("A & B");
  });
});
