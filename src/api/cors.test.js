const { buildCorsHeaders, parseAllowedOrigins } = require("./cors")

describe("parseAllowedOrigins", () => {
	const originalEnv = process.env.CORS_ALLOWED_ORIGINS

	afterEach(() => {
		if (originalEnv === undefined) {
			delete process.env.CORS_ALLOWED_ORIGINS
		} else {
			process.env.CORS_ALLOWED_ORIGINS = originalEnv
		}
		jest.resetModules()
	})

	it("returns defaults when env is unset", () => {
		delete process.env.CORS_ALLOWED_ORIGINS
		jest.resetModules()
		const { parseAllowedOrigins: parse } = require("./cors")
		expect(parse()).toEqual([
			"http://localhost:3000",
			"http://127.0.0.1:3000",
		])
	})

	it("parses comma-separated deploy-time origins", () => {
		process.env.CORS_ALLOWED_ORIGINS =
			"http://localhost:3000, https://jtasse.github.io "
		jest.resetModules()
		const { parseAllowedOrigins: parse } = require("./cors")
		expect(parse()).toEqual([
			"http://localhost:3000",
			"https://jtasse.github.io",
		])
	})
})

describe("buildCorsHeaders", () => {
	const originalEnv = process.env.CORS_ALLOWED_ORIGINS

	beforeEach(() => {
		process.env.CORS_ALLOWED_ORIGINS =
			"http://localhost:3000,https://jtasse.github.io"
		jest.resetModules()
	})

	afterEach(() => {
		if (originalEnv === undefined) {
			delete process.env.CORS_ALLOWED_ORIGINS
		} else {
			process.env.CORS_ALLOWED_ORIGINS = originalEnv
		}
		jest.resetModules()
	})

	it("echoes allowed Origin header", () => {
		const { buildCorsHeaders: build } = require("./cors")
		const headers = build({
			headers: { origin: "https://jtasse.github.io" },
		})
		expect(headers["Access-Control-Allow-Origin"]).toBe(
			"https://jtasse.github.io",
		)
		expect(headers["Content-Type"]).toBe("application/json")
		expect(headers.Vary).toBe("Origin")
	})

	it("omits Allow-Origin for disallowed origins", () => {
		const { buildCorsHeaders: build } = require("./cors")
		const headers = build({
			headers: { Origin: "https://evil.example" },
		})
		expect(headers["Access-Control-Allow-Origin"]).toBeUndefined()
	})

	it("reads Origin with capital O", () => {
		const { buildCorsHeaders: build } = require("./cors")
		const headers = build({
			headers: { Origin: "http://localhost:3000" },
		})
		expect(headers["Access-Control-Allow-Origin"]).toBe(
			"http://localhost:3000",
		)
	})
})
