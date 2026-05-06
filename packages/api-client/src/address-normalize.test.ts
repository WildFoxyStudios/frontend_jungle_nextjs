import { describe, expect, it } from "vitest";
import {
  addressToApiBody,
  normalizeAddressFromApi,
} from "./address-normalize";

describe("address-normalize", () => {
  it("maps backend row (address, zip) to UI Address", () => {
    const a = normalizeAddressFromApi({
      id: 3,
      user_id: 1,
      name: "Home",
      phone: "",
      country: "NO",
      city: "Oslo",
      zip: "0150",
      address: "Karl Johans gate 1",
      is_default: true,
    });
    expect(a.line1).toBe("Karl Johans gate 1");
    expect(a.postal_code).toBe("0150");
    expect(a.city).toBe("Oslo");
  });

  it("maps UI Address to API body", () => {
    const body = addressToApiBody({
      name: "Work",
      line1: "Main St 2",
      line2: "Suite A",
      city: "Bergen",
      state: "",
      country: "NO",
      postal_code: "5000",
      phone: "123",
      is_default: false,
    });
    expect(body.zip).toBe("5000");
    expect(body.address).toContain("Main St 2");
    expect(body.address).toContain("Suite A");
  });
});
