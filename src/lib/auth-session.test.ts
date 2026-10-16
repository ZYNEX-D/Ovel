import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clerkSessionView } from "./auth-session";

const profile = { id: "user_a", fullName: "A" };

describe("clerkSessionView", () => {
  it("hides a previous profile while the next user is loading", () => {
    const view = clerkSessionView(true, "user_b", "user_a", profile);
    assert.equal(view.profile, null);
    assert.equal(view.isLoading, true);
  });

  it("shows the profile only after it has loaded for the signed-in user", () => {
    const view = clerkSessionView(true, "user_a", "user_a", profile);
    assert.equal(view.profile, profile);
    assert.equal(view.isLoading, false);
  });

  it("is signed out without loading once Clerk is ready", () => {
    const view = clerkSessionView(true, null, "user_a", profile);
    assert.equal(view.profile, null);
    assert.equal(view.isLoading, false);
  });

  it("stays loading until Clerk has resolved the session", () => {
    const view = clerkSessionView(false, null, null, null);
    assert.equal(view.isLoading, true);
  });
});
