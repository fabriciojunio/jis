import { describe, it, expect } from "vitest";
import {
  scoreJob,
  isRemoteOrBauru,
  aprovada,
  extractTechs,
  skillMatch,
  seniorityFit,
  recencyFit,
  regionFit,
} from "./scoring";
import type { Job } from "./types";

function makeJob(over: Partial<Job>): Job {
  return {
    id: "test:1",
    title: "Vaga",
    companyName: "Empresa",
    link: "https://x.com/1",
    source: "Teste",
    remote: false,
    hybrid: false,
    level: null,
    techs: null,
    description: null,
    salaryMin: null,
    salaryMax: null,
    salaryInformed: false,
    location: null,
    finalScore: null,
    scoreBreakdown: null,
    chance: null,
    chanceLabel: null,
    fitReasons: null,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...over,
  };
}

describe("scoreJob", () => {
  it("dá chance alta para vaga remota júnior na stack, recente e que aceita Brasil", () => {
    const job = scoreJob(
      makeJob({
        title: "Desenvolvedor Java Júnior",
        description: "Vaga remota com Java e Spring Boot e Node.js",
        remote: true,
        location: "Brazil",
      })
    );
    expect(job.chance).toBeGreaterThan(60);
    expect(job.chanceLabel).toBe("Alta");
    expect(job.level).toBe("Júnior");
    expect(job.fitReasons).toEqual(expect.arrayContaining([expect.stringMatching(/Stack/)]));
  });

  it("penaliza stack incompatível (.NET / C#)", () => {
    const compat = scoreJob(makeJob({ title: "Dev Python", description: "Python e FastAPI", remote: true, location: "Worldwide" }));
    const incompat = scoreJob(makeJob({ title: "Dev C#", description: ".NET e C#", remote: true, location: "Worldwide" }));
    expect(incompat.finalScore!).toBeLessThan(compat.finalScore!);
  });
});

describe("filtros de probabilidade (evidência)", () => {
  it("skillMatch sobe com techs do núcleo", () => {
    expect(skillMatch("java spring boot react").ratio).toBeGreaterThan(skillMatch("apenas html").ratio);
    expect(skillMatch("java python node react typescript").ratio).toBe(1);
  });

  it("seniorityFit zera para vaga sênior", () => {
    expect(seniorityFit("desenvolvedor java júnior").fit).toBe(1);
    expect(seniorityFit("senior software engineer").fit).toBe(0);
    expect(seniorityFit("tech lead / architect").fit).toBe(0);
  });

  it("recencyFit cai com a idade e zera após 30 dias", () => {
    const ontem = new Date(Date.now() - 1 * 86400000).toISOString();
    const velha = new Date(Date.now() - 45 * 86400000).toISOString();
    expect(recencyFit(ontem)).toBe(1);
    expect(recencyFit(velha)).toBe(0);
  });

  it("regionFit aceita Worldwide e rejeita US-only", () => {
    expect(regionFit(makeJob({ remote: true, location: "Worldwide" })).permitida).toBe(true);
    expect(regionFit(makeJob({ remote: true, location: "USA Only" })).permitida).toBe(false);
    expect(regionFit(makeJob({ remote: false, location: "Bauru, São Paulo, Brazil" })).permitida).toBe(true);
  });
});

describe("aprovada (gate de altas chances)", () => {
  const bom = () =>
    scoreJob(
      makeJob({
        title: "Desenvolvedor Java Júnior",
        description: "Remoto, Java, Spring Boot, Node",
        remote: true,
        location: "Brazil",
      })
    );

  it("aprova vaga forte e recente", () => {
    expect(aprovada(bom())).toBe(true);
  });

  it("reprova vaga sênior", () => {
    const j = scoreJob(makeJob({ title: "Senior Java Engineer", description: "10+ years", remote: true, location: "Worldwide" }));
    expect(aprovada(j)).toBe(false);
  });

  it("reprova vaga remota restrita a outra região", () => {
    const j = scoreJob(makeJob({ title: "Java Developer Junior", description: "Java Spring", remote: true, location: "United States" }));
    expect(aprovada(j)).toBe(false);
  });

  it("reprova vaga muito antiga", () => {
    const velha = new Date(Date.now() - 60 * 86400000).toISOString();
    const j = scoreJob(makeJob({ title: "Java Junior", description: "Java Spring", remote: true, location: "Brazil", publishedAt: velha }));
    expect(aprovada(j)).toBe(false);
  });

  it("reprova vaga sem aderência de stack", () => {
    const j = scoreJob(makeJob({ title: "Customer Support Agent", description: "atendimento ao cliente", remote: true, location: "Worldwide" }));
    expect(aprovada(j)).toBe(false);
  });

  it("reprova estágio em empresa pequena, aprova em empresa grande", () => {
    const pequena = scoreJob(
      makeJob({ title: "Estágio em Desenvolvimento Java", companyName: "Startup XYZ", remote: true, location: "Brazil" })
    );
    expect(aprovada(pequena)).toBe(false);

    const grande = scoreJob(
      makeJob({ title: "Estágio em Desenvolvimento Java", companyName: "Nubank", remote: true, location: "Brazil" })
    );
    expect(aprovada(grande)).toBe(true);
  });
});

describe("isRemoteOrBauru / extractTechs", () => {
  it("aceita remoto e Bauru, rejeita presencial fora", () => {
    expect(isRemoteOrBauru(makeJob({ remote: true }))).toBe(true);
    expect(isRemoteOrBauru(makeJob({ location: "Bauru, São Paulo, Brazil" }))).toBe(true);
    expect(isRemoteOrBauru(makeJob({ location: "São Paulo, SP" }))).toBe(false);
  });

  it("extrai e normaliza techs", () => {
    expect(extractTechs("Node.js, Next.js e Spring Boot")).toEqual(
      expect.arrayContaining(["Node.js", "Next.js", "Spring Boot"])
    );
  });
});
