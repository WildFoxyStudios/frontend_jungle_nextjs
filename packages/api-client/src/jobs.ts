import { api } from "./client";
import type { Job, JobApplication, SavedJob, JobAlert, Resume, PaginatedResponse } from "./types/index";

export const jobsApi = {
  getJobs: (cursor?: string, filters?: { category?: string; location?: string; q?: string; type?: string }) =>
    api.get<PaginatedResponse<Job>>("/v1/jobs", { cursor, ...filters }),
  getCategories: () =>
    api.get<{ id: number; name: string }[]>("/v1/jobs/categories"),
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
  getMyApplications: () =>
    api.get<JobApplication[]>("/v1/jobs/applications/my"),
  getAppliedJobs: () =>
    api.get<{ data: Job[] }>("/v1/jobs/applied"),
  withdrawApplication: (id: number) =>
    api.delete<void>(`/v1/jobs/applications/${id}`),
  getMyJobs: () =>
    api.get<Job[]>("/v1/jobs/my"),
  searchJobs: (params: { q?: string; location?: string; job_type?: string; category_id?: number; cursor?: number; limit?: number }) =>
    api.get<PaginatedResponse<Job>>("/v1/jobs/search", params),
  getNearbyJobs: (params: { lat: number; lng: number; radius_km?: number; cursor?: number; limit?: number }) =>
    api.get<PaginatedResponse<Job>>("/v1/jobs/nearby", params),

  // Saved jobs
  saveJob: (jobId: number) =>
    api.post<void>(`/v1/jobs/${jobId}/save`, { job_id: jobId }),
  listSavedJobs: () =>
    api.get<SavedJob[]>("/v1/users/me/saved-jobs"),

  // Job alerts
  createJobAlert: (data: { query?: string; frequency?: string }) =>
    api.post<JobAlert>("/v1/users/me/job-alerts", data),
  listJobAlerts: () =>
    api.get<JobAlert[]>("/v1/users/me/job-alerts"),
  deleteJobAlert: (id: number) =>
    api.delete<void>(`/v1/users/me/job-alerts/${id}`),

  // Resume
  uploadResume: (data: { file_url: string; file_name?: string }) =>
    api.post<Resume>("/v1/users/me/resume", data),
  getMyResume: () =>
    api.get<Resume | null>("/v1/users/me/resume"),
};
