import type { Job } from "./types";

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo: string | null;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
}

const TARGET_TECHS = [
  "java", "spring", "spring boot", "typescript", "javascript", "python",
  "react", "next.js", "nextjs", "node.js", "nodejs", "nestjs", "fastapi",
  "postgresql", "postgres", "docker", "redis", "kafka", "microservices",
  "rest", "api", "fullstack", "full stack", "backend", "frontend",
];

function scoreJob(job: RemotiveJob, index: number): Job {
  const text = `${job.title} ${job.tags.join(" ")}`.toLowerCase();

  const matchedTechs = TARGET_TECHS.filter((t) => text.includes(t));
  const techScore = Math.min(matchedTechs.length / 4, 1);

  let salaryMin: number | null = null;
  let salaryMax: number | null = null;
  let salaryInformed = false;
  if (job.salary && job.salary.trim()) {
    const nums = job.salary.match(/\d[\d,.]*/g);
    if (nums && nums.length >= 1) {
      salaryMin = parseInt(nums[0].replace(/[,.]/g, ""), 10) || null;
      salaryMax = nums[1] ? parseInt(nums[1].replace(/[,.]/g, ""), 10) || null : null;
      salaryInformed = true;
    }
  }

  const remoteBonus = job.candidate_required_location.toLowerCase().includes("worldwide") ||
    job.candidate_required_location.toLowerCase().includes("remote") ? 0.1 : 0;

  const finalScore = Math.round((techScore * 0.7 + remoteBonus + 0.15) * 100);

  const techs = job.tags.length > 0 ? job.tags.slice(0, 6) : null;

  return {
    id: job.id,
    title: job.title,
    companyName: job.company_name,
    link: job.url,
    source: "Remotive",
    remote: job.candidate_required_location.toLowerCase().includes("worldwide") ||
      job.candidate_required_location.toLowerCase().includes("remote"),
    hybrid: false,
    level: null,
    techs,
    salaryMin,
    salaryMax,
    salaryInformed,
    location: job.candidate_required_location || "Remoto",
    finalScore,
    scoreMl: finalScore / 100,
    scoreBreakdown: { techs: techScore, remote: remoteBonus },
    publishedAt: job.publication_date,
    createdAt: new Date().toISOString(),
  };
}

export async function fetchRemotiveJobs(limit = 20): Promise<Job[]> {
  try {
    const res = await fetch(
      "https://remotive.com/api/remote-jobs?category=software-dev&limit=50",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`Remotive: ${res.status}`);
    const data = (await res.json()) as { jobs: RemotiveJob[] };

    return data.jobs
      .map((j, i) => scoreJob(j, i))
      .sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0))
      .slice(0, limit);
  } catch {
    return [];
  }
}
