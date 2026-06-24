import { describe, it, expect } from "vitest";
import { parseLinkedinHtml } from "./linkedin";
import { parseWwrRss } from "./weworkremotely";
import { mapRemotive } from "./remotive";
import { mapRemoteOk } from "./remoteok";
import { mapGetOnBoard } from "./getonboard";

describe("parseLinkedinHtml", () => {
  const html = `
  <li>
    <div class="base-card relative job-search-card" data-entity-urn="urn:li:jobPosting:4376401226">
      <a class="base-card__full-link" href="https://br.linkedin.com/jobs/view/desenvolvedor-java-junior-at-acme-4376401226?pos=1">
        <span class="sr-only">Desenvolvedor Java Júnior</span>
      </a>
      <div class="base-search-card__info">
        <h3 class="base-search-card__title">
          Desenvolvedor Java Júnior
        </h3>
        <h4 class="base-search-card__subtitle">
          <a class="hidden-nested-link" href="https://www.linkedin.com/company/acme">Acme</a>
        </h4>
        <span class="job-search-card__location">Bauru, São Paulo, Brazil</span>
        <time class="job-search-card__listdate" datetime="2026-06-20">há 3 dias</time>
      </div>
    </div>
  </li>`;

  it("extrai título, empresa, local e link", () => {
    const jobs = parseLinkedinHtml(html);
    expect(jobs).toHaveLength(1);
    const j = jobs[0];
    expect(j.title).toBe("Desenvolvedor Java Júnior");
    expect(j.companyName).toBe("Acme");
    expect(j.location).toContain("Bauru");
    expect(j.link).toContain("/jobs/view/");
    expect(j.source).toBe("LinkedIn");
    expect(j.publishedAt).toMatch(/^2026-06-20/);
  });

  it("ignora HTML sem cards", () => {
    expect(parseLinkedinHtml("<html><body>nada</body></html>")).toHaveLength(0);
  });
});

describe("parseWwrRss", () => {
  const xml = `<?xml version="1.0"?><rss><channel>
    <item>
      <title>Acme Inc: Backend Ruby Developer</title>
      <link>https://weworkremotely.com/remote-jobs/acme-inc-backend-ruby-developer</link>
      <region>Anywhere</region>
      <pubDate>Mon, 20 Jun 2026 10:00:00 +0000</pubDate>
      <description><![CDATA[<p>Build APIs with <strong>Ruby</strong>.</p>]]></description>
    </item>
  </channel></rss>`;

  it("separa empresa e cargo e marca como remoto", () => {
    const jobs = parseWwrRss(xml);
    expect(jobs).toHaveLength(1);
    const j = jobs[0];
    expect(j.companyName).toBe("Acme Inc");
    expect(j.title).toBe("Backend Ruby Developer");
    expect(j.remote).toBe(true);
    expect(j.description).toContain("Ruby");
  });
});

describe("mapRemotive / mapRemoteOk", () => {
  it("normaliza vaga da Remotive", () => {
    const j = mapRemotive({
      id: 99,
      url: "https://remotive.com/x",
      title: "Senior Go Engineer",
      company_name: "Globex",
      tags: ["go", "docker"],
      publication_date: "2026-06-19T00:00:00",
      candidate_required_location: "Worldwide",
      salary: "",
      description: "<p>Work with Go</p>",
    });
    expect(j.id).toBe("remotive:99");
    expect(j.remote).toBe(true);
    expect(j.techs).toEqual(["go", "docker"]);
    expect(j.description).toContain("Work with Go");
  });

  it("ignora item inválido da RemoteOK", () => {
    expect(mapRemoteOk({ id: undefined, position: undefined })).toBeNull();
    const j = mapRemoteOk({ id: "5", position: "Dev", company: "Initech" });
    expect(j?.id).toBe("remoteok:5");
  });

  it("normaliza vaga remota do Get on Board (LATAM)", () => {
    const j = mapGetOnBoard({
      id: "dev-java-acme",
      links: { public_url: "https://www.getonbrd.com/jobs/dev-java-acme" },
      attributes: {
        title: "Desarrollador Java Junior",
        description: "<p>Java y Spring</p>",
        remote: true,
        remote_modality: "fully_remote",
        remote_zone: "latam",
        tags: ["java", "spring"],
        published_at: 1782226510,
      },
    });
    expect(j?.id).toBe("getonbrd:dev-java-acme");
    expect(j?.remote).toBe(true);
    expect(j?.location).toBe("latam");
    expect(j?.publishedAt).toMatch(/^20/);
  });
});
