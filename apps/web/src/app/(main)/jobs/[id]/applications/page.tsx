import { JobApplicationsClient } from "./JobApplicationsClient";

export const metadata = {
  title: "Job Applications | Jungle",
};

interface Props { params: Promise<{ id: string }> }

export default async function JobApplicationsPage({ params }: Props) {
  const { id } = await params;
  return <JobApplicationsClient id={id} />;
}
