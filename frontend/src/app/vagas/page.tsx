import { getJobs } from "@/lib/jobs";
import { VagasClient } from "./VagasClient";

export const revalidate = 1800;

export default async function VagasPage() {
  const { jobs } = await getJobs();
  return <VagasClient jobs={jobs} />;
}
