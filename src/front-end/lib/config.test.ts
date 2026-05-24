import { afterEach, describe, expect, it, vi } from "vitest"

describe("withBasePath", () => {
	afterEach(() => {
		vi.unstubAllEnvs()
		vi.resetModules()
	})

	it("returns path unchanged when base path is empty", async () => {
		vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "")
		const { withBasePath } = await import("./config")
		expect(withBasePath("/videos/reveal-background.webm")).toBe(
			"/videos/reveal-background.webm",
		)
	})

	it("prefixes paths with GitHub Pages base path", async () => {
		vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/meowlin")
		const { withBasePath } = await import("./config")
		expect(withBasePath("/videos/reveal-background.webm")).toBe(
			"/meowlin/videos/reveal-background.webm",
		)
	})

	it("normalizes paths without a leading slash", async () => {
		vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/meowlin")
		const { withBasePath } = await import("./config")
		expect(withBasePath("videos/foo.webm")).toBe("/meowlin/videos/foo.webm")
	})
})

describe("config", () => {
	afterEach(() => {
		vi.unstubAllEnvs()
		vi.resetModules()
	})

	it("reads apiBaseUrl and appEnv from env", async () => {
		vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example/prod")
		vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production")
		vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/meowlin")
		const { config } = await import("./config")
		expect(config.apiBaseUrl).toBe("https://api.example/prod")
		expect(config.appEnv).toBe("production")
		expect(config.basePath).toBe("/meowlin")
	})
})
