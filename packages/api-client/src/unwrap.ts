import type { PaginatedResponse } from "./types/index";

/** Admin list responses are either a bare `T[]` or `{ data: T[], meta?: ... }`. */
export function unwrapAdminList<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object" && "data" in body) {
    const d = (body as { data: unknown }).data;
    if (Array.isArray(d)) return d as T[];
  }
  return [];
}

/**
 * Normalizes cursor-style paginated admin responses and tolerates missing `meta` / `data`.
 */
export function unwrapPaginated<T>(body: unknown): PaginatedResponse<T> {
  if (body && typeof body === "object" && "data" in body) {
    const p = body as { data: unknown; meta?: PaginatedResponse<T>["meta"] };
    const data = Array.isArray(p.data) ? (p.data as T[]) : [];
    const meta: PaginatedResponse<T>["meta"] = { has_more: p.meta?.has_more ?? false };
    if (p.meta?.cursor != null) meta.cursor = p.meta.cursor;
    if (p.meta?.total != null) meta.total = p.meta.total;
    if (p.meta?.per_page != null) meta.per_page = p.meta.per_page;
    return { data, meta };
  }
  if (Array.isArray(body)) {
    return { data: body, meta: { has_more: false, total: body.length } };
  }
  return { data: [], meta: { has_more: false, total: 0 } };
}

/**
 * When the backend only returns `meta.has_more` (cursor pagination) and omits
 * `meta.total`, derive a total suitable for the DataTable pager.
 */
export function cursorPagerTotal(
  page: number,
  perPage: number,
  rowCount: number,
  hasMore: boolean,
  explicitTotal?: number,
): number {
  if (explicitTotal != null && explicitTotal > 0) return explicitTotal;
  const loaded = (page - 1) * perPage + rowCount;
  return hasMore ? loaded + 1 : loaded;
}
