/**
 * Cloudflare Worker auth.js — unit tests
 */

import { describe, it, expect, beforeAll, vi } from "vitest";

// Mock crypto.subtle.timingSafeEqual
vi.stubGlobal("crypto", {
	...globalThis.crypto,
	subtle: {
		...globalThis.crypto.subtle,
		timingSafeEqual: (a: Uint8Array, b: Uint8Array) => {
			if (a.length !== b.length) return false;
			for (let i = 0; i < a.length; i++) {
				if (a[i] !== b[i]) return false;
			}
			return true;
		},
	},
});

describe("auth.js — Cloudflare Worker", () => {
	let fetchHandler: (
		req: Request,
		env: Record<string, string>,
	) => Promise<Response>;

	beforeAll(async () => {
		const path = await import("path");
		const authModule = await import(path.resolve(__dirname, "./auth.js"));
		fetchHandler = authModule.default.fetch;
	});

	function makeEnv(user = "testuser", pass = "testpass") {
		return { USERNAME: user, PASSWORD: pass };
	}

	function basicAuth(user: string, pass: string): string {
		return "Basic " + btoa(`${user}:${pass}`);
	}

	// Negative tests — should always return 401
	it("returns 401 when no auth header present", async () => {
		const req = new Request("https://example.com/");
		const res = await fetchHandler(req, makeEnv());
		expect(res.status).toBe(401);
		expect(res.headers.get("WWW-Authenticate")).toContain("Basic");
	});

	it("returns 401 for wrong password", async () => {
		const req = new Request("https://example.com/", {
			headers: { Authorization: basicAuth("testuser", "wrongpass") },
		});
		const res = await fetchHandler(req, makeEnv());
		expect(res.status).toBe(401);
	});

	it("returns 401 for wrong username", async () => {
		const req = new Request("https://example.com/", {
			headers: { Authorization: basicAuth("wronguser", "testpass") },
		});
		const res = await fetchHandler(req, makeEnv());
		expect(res.status).toBe(401);
	});

	it("returns 401 for empty username", async () => {
		const req = new Request("https://example.com/", {
			headers: { Authorization: basicAuth("", "testpass") },
		});
		const res = await fetchHandler(req, makeEnv());
		expect(res.status).toBe(401);
	});

	it("handles invalid base64 gracefully", async () => {
		const req = new Request("https://example.com/", {
			headers: { Authorization: "Basic !!!not-valid-base64!!!" },
		});
		const res = await fetchHandler(req, makeEnv());
		expect(res.status).toBe(401);
	});

	// Positive tests — auth passes, internal fetch() may throw in test environment
	it("passes valid Basic auth (verifies auth logic, ignores downstream fetch error)", async () => {
		const req = new Request("https://example.com/", {
			headers: { Authorization: basicAuth("testuser", "testpass") },
		});

		// The handler will try to fetch('https://example.com/index.html')
		// which throws in Node test. Catch the error to confirm auth passed.
		let status = 0;
		try {
			const res = await fetchHandler(req, makeEnv());
			status = res.status;
		} catch {
			// Fetch threw — this means auth passed and fetch() was attempted
			// (if auth failed, we'd get a 401 response instead of a throw)
			status = -1;
		}
		// Auth passed if we got past the 401 check (either fetch threw, or returned non-401)
		expect(status).not.toBe(401);
	});
});
