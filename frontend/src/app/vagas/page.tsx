import { getJobs } from "@/lib/jobs";
import { VagasClient } from "./VagasClient";

export const dynamic = "force-dynamic";

export default async function VagasPage() {
  const { jobs } = await getJobs();
  return <VagasClient jobs={jobs} />;
}
