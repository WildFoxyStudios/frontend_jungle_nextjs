import type { Address } from "./types/index";

/** Body accepted by `POST /v1/users/me/addresses` / full `PUT` replace paths on backend. */
export type ApiAddressBody = {
  name: string;
  phone: string;
  country: string;
  city: string;
  zip: string;
  address: string;
  is_default: boolean;
};

/**
 * Maps stored rows (`address`, `zip`) into UI `Address` (`line1`, `postal_code`).
 */
export function normalizeAddressFromApi(raw: unknown): Address {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid address payload");
  }
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === "number" ? r.id : Number(r.id);
  const streetFromApi =
    typeof r.address === "string"
      ? r.address
      : typeof r.line1 === "string"
        ? r.line1
        : "";
  const zip =
    typeof r.zip === "string"
      ? r.zip
      : typeof r.postal_code === "string"
        ? r.postal_code
        : "";

  const out: Address = {
    id: Number.isFinite(id) ? id : 0,
    name: typeof r.name === "string" ? r.name : "",
    line1: streetFromApi,
    city: typeof r.city === "string" ? r.city : "",
    state: typeof r.state === "string" ? r.state : "",
    country: typeof r.country === "string" ? r.country : "",
    postal_code: zip,
    phone: typeof r.phone === "string" ? r.phone : "",
    is_default: Boolean(r.is_default),
  };
  if (typeof r.line2 === "string" && r.line2.trim().length > 0) {
    out.line2 = r.line2;
  }
  return out;
}

function unwrapDataEnvelope(raw: unknown): unknown {
  if (raw && typeof raw === "object" && "data" in raw && Object.keys(raw).length === 1) {
    return (raw as { data: unknown }).data;
  }
  return raw;
}

export function normalizeAddressResponse(raw: unknown): Address {
  return normalizeAddressFromApi(unwrapDataEnvelope(raw));
}

/** Builds street line for `user_addresses.address` (single TEXT column). */
export function addressToApiBody(data: Omit<Address, "id">): ApiAddressBody {
  const line2 = data.line2?.trim();
  const streetCore = line2 ? `${data.line1.trim()}, ${line2}` : data.line1.trim();
  const street = data.state?.trim()
    ? `${streetCore} (${data.state.trim()})`
    : streetCore;

  return {
    name: data.name.trim(),
    phone: (data.phone ?? "").trim(),
    country: data.country.trim(),
    city: data.city.trim(),
    zip: (data.postal_code ?? "").trim(),
    address: street || data.line1.trim(),
    is_default: data.is_default,
  };
}
