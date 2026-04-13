import { api } from "./client";
import type { Blog, PaginatedResponse } from "./types/index";

export const blogsApi = {
  getBlogs: (cursor?: string, category?: string) =>
    api.get<PaginatedResponse<Blog>>("/v1/blogs", { cursor, category }),
  getBlog: (id: number) => api.get<Blog>(`/v1/blogs/${id}`),
  createBlog: (data: { title: string; content: string; category?: string; tags?: string[]; cover?: string }) =>
    api.post<Blog>("/v1/blogs", data),
  updateBlog: (id: number, data: Partial<Blog>) =>
    api.patch<Blog>(`/v1/blogs/${id}`, data),
  deleteBlog: (id: number) => api.delete<void>(`/v1/blogs/${id}`),
  getMyBlogs: (cursor?: string) =>
    api.get<PaginatedResponse<Blog>>("/v1/blogs/my", { cursor }),
  reactToBlog: (id: number, reaction: string) =>
    api.post<void>(`/v1/blogs/${id}/react`, { reaction }),
  getBlogComments: (id: number, cursor?: string) =>
    api.get<PaginatedResponse<unknown>>(`/v1/blogs/${id}/comments`, { cursor }),
  createBlogComment: (id: number, content: string) =>
    api.post<unknown>(`/v1/blogs/${id}/comments`, { content }),
  uploadBlogImage: (formData: FormData, onProgress?: (pct: number) => void) =>
    api.upload<{ url: string }>("/v1/blogs/upload-image", formData, onProgress),
  getCategories: () => api.get<{ id: number; name: string }[]>("/v1/blogs/categories"),
  searchBlogs: (q: string, cursor?: string) =>
    api.get<PaginatedResponse<Blog>>("/v1/blogs/search", { q, cursor }),
  getBlogsByCategory: (categoryId: number, cursor?: string) =>
    api.get<PaginatedResponse<Blog>>(`/v1/blogs/category/${categoryId}`, { cursor }),
  deleteBlogComment: (id: number) => api.delete<void>(`/v1/blogs/comments/${id}`),
};
