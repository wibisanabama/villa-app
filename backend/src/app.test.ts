import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./app.js";

describe("Vilara API", () => {
  it("returns a healthy response envelope", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("ok");
  });

  it("returns a consistent 404 error envelope", async () => {
    const response = await request(app).get("/api/unknown");
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
    expect(response.body.error.requestId).toBeTruthy();
  });

  it("protects private resources", async () => {
    const response = await request(app).get("/api/v1/me");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });
});
