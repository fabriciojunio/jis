import type { Job } from "../types";
import { baseJob, decode, safeFetch, stripHtml } from "./util";

/** WeWorkRemotely — feed RSS de vagas remotas de programação. */

const FEED = "https://weworkremotely.com/categories/remote-programming-jobs.rss";

function tag(item: string, name: string): string {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i").exec(item);
  if (!m) return "";
  return decode(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim());
}

/** Parser puro do RSS (exportado para testes). */
export function parseWwrRss(xml: string): Job[] {
  const jobs: Job[] = [];
  const items = xml.split(/<item>/i).slice(1);

  for (const raw of items) {
    const item = raw.split(/<\/item>/i)[0];
    const rawTitle = tag(item, "title");
    const link = tag(item, "link");
    if (!rawTitle || !link) continue;

    // formato comum: "Empresa: Cargo"
    let company = "Empresa";
    let title = rawTitle;
    const sep = rawTitle.indexOf(":");
    if (sep > 0 && sep < 60) {
      company = rawTitle.slice(0, sep).trim();
      title = rawTitle.slice(sep + 1).trim();
    }

    const region = tag(item, "region");
    const pubDate = tag(item, "pubDate");
    const description = stripHtml(tag(item, "description")).slice(0, 4000);
    const id = /\/remote-jobs\/([^/]+)\/?$/.exec(link)?.[1] ?? link;

    jobs.push(
      baseJob({
        id: `wwr:${id}`,
        title,
        companyName: company,
        link,
        source: "WeWorkRemotely",
        remote: true,
        location: region || "Remoto",
        description,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : null,
      })
    );
  }
  return jobs;
}

export async function fetchWeWorkRemotely(): Promise<Job[]> {
  const res = await safeFetch(FEED);
  if (!res) return [];
  try {
    return parseWwrRss(await res.text());
  } catch {
    return [];
  }
}
