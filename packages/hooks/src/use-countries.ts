"use client";

import { useEffect, useState } from "react";
import { referenceApi, type CountryItem } from "@jungle/api-client";

let cachedCountries: CountryItem[] | null = null;
let isLoading = false;
let inflight: Promise<CountryItem[]> | null = null;

async function fetchCountries(): Promise<CountryItem[]> {
  if (cachedCountries) return cachedCountries;
  if (inflight) return inflight;

  inflight = referenceApi
    .getCountries()
    .then((r) => {
      cachedCountries = (r.data ?? []) as CountryItem[];
      return cachedCountries;
    })
    .catch(() => {
      cachedCountries = null;
      return [] as CountryItem[];
    })
    .finally(() => {
      isLoading = false;
      inflight = null;
    });

  isLoading = true;
  return inflight;
}

/**
 * Fetches all active countries via GET /v1/countries.
 * Results are cached at module level for the remainder of the session.
 */
export function useCountries() {
  const [data, setData] = useState<CountryItem[]>(() => cachedCountries ?? []);
  const [loading, setLoading] = useState(() => !cachedCountries);

  useEffect(() => {
    if (cachedCountries) {
      setData(cachedCountries);
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchCountries().then((items) => {
      if (!cancelled) {
        setData(items);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading };
}
