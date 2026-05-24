const mockDocSend = jest.fn()

jest.mock("@aws-sdk/client-dynamodb", () => ({
	DynamoDBClient: jest.fn(),
}))

jest.mock("@aws-sdk/lib-dynamodb", () => ({
	DynamoDBDocumentClient: {
		from: jest.fn(() => ({ send: mockDocSend })),
	},
	GetCommand: jest.fn((input) => ({ input, _type: "GetCommand" })),
}))

describe("getClipResult handler", () => {
	const originalEnv = { ...process.env }
	let handler

	beforeEach(() => {
		jest.resetModules()
		process.env = {
			...originalEnv,
			CLIPS_TABLE_NAME: "clips-table",
			CORS_ALLOWED_ORIGINS: "https://jtasse.github.io",
		}
		mockDocSend.mockReset()
		handler = require("./getClipResult").handler
	})

	afterEach(() => {
		process.env = originalEnv
	})

	function apiEvent(overrides = {}) {
		return {
			requestContext: { requestId: "req-2", http: { method: "GET" } },
			rawPath: "/clips/clip-123",
			headers: { origin: "https://jtasse.github.io" },
			pathParameters: { clipId: "clip-123" },
			...overrides,
		}
	}

	it("returns 200 with clip item when found", async () => {
		const item = {
			clipId: "clip-123",
			clipStatus: "COMPLETE",
			identifiedBreed: "Siamese",
			confidenceScore: 0.92,
		}
		mockDocSend.mockResolvedValue({ Item: item })

		const response = await handler(apiEvent())

		expect(response.statusCode).toBe(200)
		expect(JSON.parse(response.body)).toEqual(item)
		expect(response.headers["Access-Control-Allow-Origin"]).toBe(
			"https://jtasse.github.io",
		)
	})

	it("returns 404 when clip is missing", async () => {
		mockDocSend.mockResolvedValue({})

		const response = await handler(apiEvent())

		expect(response.statusCode).toBe(404)
		expect(JSON.parse(response.body).message).toBe("Clip not found.")
	})

	it("returns 400 when clipId path parameter is missing", async () => {
		const response = await handler(
			apiEvent({ pathParameters: undefined }),
		)

		expect(response.statusCode).toBe(400)
		expect(mockDocSend).not.toHaveBeenCalled()
	})

	it("returns 500 when CLIPS_TABLE_NAME is not configured", async () => {
		delete process.env.CLIPS_TABLE_NAME
		jest.resetModules()
		handler = require("./getClipResult").handler

		const response = await handler(apiEvent())

		expect(response.statusCode).toBe(500)
		expect(JSON.parse(response.body).message).toMatch(/configuration/)
	})
})
