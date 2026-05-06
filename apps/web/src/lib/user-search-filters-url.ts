/**
 * Mirrors `GET /v1/search` optional user-layer query params (?uf=1&gender=male…)
 * shared by `/search` and `/search/linkedin`.
 */

export interface UserFiltersUrlState {
  isFilterActive: boolean;
  gender: string;
  verified: string;
  hasPhoto: string;
  ageFrom: number;
  ageTo: number;
}

const AGE_FROM_DEFAULT = 18;
const AGE_TO_DEFAULT = 50;

export function parseUserFiltersFromSearchParams(searchParams: URLSearchParams): UserFiltersUrlState {
  const active = searchParams.get("uf") === "1";
  const gRaw = searchParams.get("gender");
  const gender = gRaw === "male" || gRaw === "female" ? gRaw : "all";
  const verified = searchParams.get("verified_only") === "true" ? "yes" : "all";
  const hasPhoto = searchParams.get("has_photo") === "true" ? "yes" : "all";

  let ageFrom = Number.parseInt(searchParams.get("age_min") ?? `${AGE_FROM_DEFAULT}`, 10);
  let ageTo = Number.parseInt(searchParams.get("age_max") ?? `${AGE_TO_DEFAULT}`, 10);
  if (!Number.isFinite(ageFrom)) ageFrom = AGE_FROM_DEFAULT;
  if (!Number.isFinite(ageTo)) ageTo = AGE_TO_DEFAULT;
  ageFrom = Math.max(13, Math.min(120, ageFrom));
  ageTo = Math.max(ageFrom, Math.min(120, ageTo));

  return {
    isFilterActive: active,
    gender,
    verified,
    hasPhoto,
    ageFrom,
    ageTo,
  };
}

/** Writes uf + filter keys; clears them when inactive. Keeps unrelated params (tab, q, …). */
export function upsertUserFilterSearchParams(
  base: URLSearchParams,
  qTrimmed: string,
  state: UserFiltersUrlState,
): URLSearchParams {
  const p = new URLSearchParams(base.toString());
  p.set("q", qTrimmed);

  p.delete("uf");
  p.delete("gender");
  p.delete("verified_only");
  p.delete("has_photo");
  p.delete("age_min");
  p.delete("age_max");

  if (!state.isFilterActive) {
    return p;
  }

  p.set("uf", "1");
  if (state.gender !== "all") p.set("gender", state.gender);
  if (state.verified === "yes") p.set("verified_only", "true");
  if (state.hasPhoto === "yes") p.set("has_photo", "true");
  p.set("age_min", String(state.ageFrom));
  p.set("age_max", String(state.ageTo));

  return p;
}

export { AGE_FROM_DEFAULT, AGE_TO_DEFAULT };
