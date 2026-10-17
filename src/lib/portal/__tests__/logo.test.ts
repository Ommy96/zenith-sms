import { describe, it, expect, vi } from "vitest";
import { getPortalLogoUrl } from "../logo";

describe("private portal logo links", () => {
  it("requests a 24-hour link for the stored logo path", async () => {
    const sign = vi.fn().mockResolvedValue("signed-logo");
    expect(await getPortalLogoUrl("expiry-user", "school/logo.jpg", sign, 1000)).toBe("signed-logo");
    expect(sign).toHaveBeenCalledWith("school/logo.jpg", 86400);
  });
  it("reuses a cached link and refreshes it before expiry", async () => {
    const sign = vi.fn().mockResolvedValueOnce("first").mockResolvedValueOnce("second");
    await getPortalLogoUrl("cache-user", "school/logo.jpg", sign, 1000);
    expect(await getPortalLogoUrl("cache-user", "school/logo.jpg", sign, 2000)).toBe("first");
    expect(sign).toHaveBeenCalledTimes(1);
    expect(await getPortalLogoUrl("cache-user", "school/logo.jpg", sign, 86401000)).toBe("second");
    expect(sign).toHaveBeenCalledTimes(2);
  });
  it("does not reuse another user's cached link", async () => {
    const sign = vi.fn().mockResolvedValue("own-link");
    await getPortalLogoUrl("parent-a", "school/shared.jpg", sign, 1000);
    await getPortalLogoUrl("parent-b", "school/shared.jpg", sign, 1000);
    expect(sign).toHaveBeenCalledTimes(2);
  });
  it("extracts the permanent path from a legacy signed URL", async () => {
    const sign = vi.fn().mockResolvedValue(null);
    expect(await getPortalLogoUrl("legacy", "https://example.test/storage/v1/object/sign/tenant-logos/school/logo%20one.jpg?token=expired", sign)).toBeNull();
    expect(sign).toHaveBeenCalledWith("school/logo one.jpg", 86400);
  });
});