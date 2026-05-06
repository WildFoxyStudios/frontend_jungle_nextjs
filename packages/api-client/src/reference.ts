import { api } from "./client";

export interface LookupItem {
  id: number;
  lookup_type: string;
  value: string;
  label_key: string;
  icon: string | null;
  sort_order: number;
}

export interface CountryItem {
  id: number;
  name: string;
  iso_code: string;
  iso3_code: string | null;
  phone_code: string | null;
  flag_emoji: string | null;
  currency_code: string | null;
}

export const referenceApi = {
  getLookups: (lookupType: string) =>
    api.get<{ data: LookupItem[] }>(`/v1/lookups/${lookupType}`),

  getCountries: (q?: string) =>
    api.get<{ data: CountryItem[] }>("/v1/countries", q ? { q } : undefined),
};
