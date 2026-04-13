import type { Metadata } from "next";
import { jobsApi } from "@jungle/api-client";
import { buildJobMetadata, jobJsonLd, BASE_URL } from "@/lib/seo";
import { JobClient } from "./JobClient";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const job = await jobsApi.getJob(Number(id));
    return buildJobMetadata(job);
  } catch {
    return { title: "Job | Jungle" };
  }
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;

  let jsonLd = null;
  try {
    const job = await jobsApi.getJob(Number(id));
    jsonLd = jobJsonLd({ ...job, url: `${BASE_URL}/jobs/${id}` });
  } catch {}

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <JobClient id={id} />
    </>
  );
}
