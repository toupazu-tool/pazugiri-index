import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSessionValue, isAllowedLogin, verifySessionValue } from "./adminAuth";

const saved = { ...process.env };
beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "test-secret-test-secret-test-secret-1234";
  process.env.ADMIN_GITHUB_LOGIN = "toupazu-tool";
});
afterEach(() => {
  process.env = { ...saved };
});

describe("adminAuth", () => {
  it("オーナーのユーザー名だけ通す（大文字小文字は区別しない）", () => {
    expect(isAllowedLogin("toupazu-tool")).toBe(true);
    expect(isAllowedLogin("Toupazu-Tool")).toBe(true);
    expect(isAllowedLogin("someone")).toBe(false);
  });

  it("自分で作った Cookie は通り、書き換えたものは通らない", async () => {
    const value = await createSessionValue("toupazu-tool");
    expect(await verifySessionValue(value)).toBe("toupazu-tool");
    const [, exp, sig] = value.split(".");
    expect(await verifySessionValue(`someone.${exp}.${sig}`)).toBeNull();
    expect(await verifySessionValue(`toupazu-tool.${Number(exp) + 999}.${sig}`)).toBeNull();
    expect(await verifySessionValue(undefined)).toBeNull();
  });

  it("期限切れは通らない", async () => {
    const value = await createSessionValue("toupazu-tool");
    const realNow = Date.now;
    Date.now = () => realNow() + 8 * 24 * 60 * 60 * 1000;
    try {
      expect(await verifySessionValue(value)).toBeNull();
    } finally {
      Date.now = realNow;
    }
  });

  it("署名の鍵が変わると、前の Cookie は通らない", async () => {
    const value = await createSessionValue("toupazu-tool");
    process.env.ADMIN_SESSION_SECRET = "another-secret-another-secret-another-1";
    expect(await verifySessionValue(value)).toBeNull();
  });
});
