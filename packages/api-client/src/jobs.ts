import { api } from "./client";
import type { Job, JobApplication, PaginatedResponse } from "./types/index";

export const jobsApi = {
  getJobs: (cursor?: string, filters?: { category?: string; location?: string; q?: string }) =>
    api.get<PaginatedResponse<Job>>("/v1/jobs", { cursor, ...filters }),
  getJob: (id: number) => api.get<Job>(`/v1/jobs/${id}`),
  createJob: (data: Partial<Job> & { title: string; description: string }) =>
    api.post<Job>("/v1/jobs", data),
  updateJob: (id: number, data: Partial<Job>) =>
    api.patch<Job>(`/v1/jobs/${id}`, data),
  deleteJob: (id: number) => api.delete<void>(`/v1/jobs/${id}`),
  applyToJob: (id: number, data: { answers: { question_id: number; answer: string }[]; cover_letter?: string }) =>
    api.post<JobApplication>(`/v1/jobs/${id}/apply`, data),
  getApplications: (jobId: number) =>
    api.get<JobApplication[]>(`/v1/jobs/${jobId}/applications`),
  updateApplicationStatus: (id: number, status: "accepted" | "rejected" | "pending") =>
    api.patch<void>(`/v1/jobs/applications/${id}`, { status }),
};
