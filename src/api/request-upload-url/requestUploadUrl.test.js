const crypto = require("crypto")

const mockDocSend = jest.fn()
const mockGetSignedUrl = jest.fn()

jest.mock("@aws-sdk/client-dynamodb", () => ({
	DynamoDBClient: jest.fn(),
}))

jest.mock("@aws-sdk/lib-dynamodb", () => ({
	DynamoDBDocumentClient: {
		from: jest.fn(() => ({ send: mockDocSend })),
	},
	PutCommand: jest.fn((input) => ({ input, _type: "PutCommand" })),
}))

jest.mock("@aws-sdk/client-s3", () => ({
	S3Client: jest.fn(),
	PutObjectCommand: jest.fn((input) => ({ input, _type: "PutObjectCommand" })),
}))

jest.mock("@aws-sdk/s3-request-presigner", () => ({
	getSignedUrl: (...args) => mockGetSignedUrl(...args),
}))

describe("requestUploadUrl helpers", () => {
	const {
		isAllowedContentType,
		extensionFromFileName,
	} = require("./requestUploadUrl")

	describe("isAllowedContentType", () => {
		it("accepts common audio MIME types", () => {
			expect(isAllowedContentType("audio/mpeg")).toBe(true)
			expect(isAllowedContentType("audio/webm")).toBe(true)
		})

		it("accepts any audio/* type", () => {
			expect(isAllowedContentType("audio/x-custom")).toBe(true)
		})

		it("strips parameters and normalizes case", () => {
			expect(isAllowedContentType("Audio/MPEG; codecs=mp3")).toBe(true)
		})

		it("rejects non-audio types", () => {
			expect(isAllowedContentType("video/mp4")).toBe(false)
			expect(isAllowedContentType("application/json")).toBe(false)
			expect(isAllowedContentType("")).toBe(false)
		})
	})

	describe("extensionFromFileName", () => {
		it("uses file extension when present", () => {
			expect(extensionFromFileName("meow.mp3")).toBe("mp3")
			expect(extensionFromFileName("clip.WAV")).toBe("wav")
		})

		it("falls back to audio when extension missing", () => {
			expect(extensionFromFileName("meow")).toBe("audio")
			expect(extensionFromFileName("")).toBe("audio")
		})
	})
})

describe("requestUploadUrl handler", () => {
	const originalEnv = { ...process.env }
	let handler

	beforeEach(() => {
		jest.resetModules()
		process.env = {
			...originalEnv,
			CLIPS_TABLE_NAME: "clips-table",
			RAW_AUDIO_BUCKET_NAME: "raw-audio-bucket",
			MAX_UPLOAD_BYTES: "10485760",
			CORS_ALLOWED_ORIGINS: "http://localhost:3000",
		}
		mockDocSend.mockReset()
		mockGetSignedUrl.mockReset()
		mockGetSignedUrl.mockResolvedValue("https://example.com/presigned")
		jest.spyOn(crypto, "randomUUID").mockReturnValue("clip-uuid-123")
		handler = require("./requestUploadUrl").handler
	})

	afterEach(() => {
		process.env = originalEnv
		jest.restoreAllMocks()
	})

	function apiEvent(overrides = {}) {
		return {
			requestContext: { requestId: "req-1", http: { method: "POST" } },
			rawPath: "/uploads",
			headers: { origin: "http://localhost:3000" },
			body: JSON.stringify({
				clientClipId: "client-1",
				fileName: "meow.mp3",
				contentType: "audio/mpeg",
				fileSize: 1024,
			}),
			...overrides,
		}
	}

	it("returns 200 with presigned upload details on success", async () => {
		mockDocSend.mockResolvedValue({})

		const response = await handler(apiEvent())
		const body = JSON.parse(response.body)

		expect(response.statusCode).toBe(200)
		expect(response.headers["Access-Control-Allow-Origin"]).toBe(
			"http://localhost:3000",
		)
		expect(body).toMatchObject({
			clipId: "clip-uuid-123",
			clientClipId: "client-1",
			clipStatus: "PENDING_UPLOAD",
			s3Key: "uploads/clip-uuid-123/client-1.mp3",
			contentType: "audio/mpeg",
			uploadUrl: "https://example.com/presigned",
			maxUploadBytes: 10485760,
		})
		expect(mockDocSend).toHaveBeenCalledTimes(1)
		expect(mockGetSignedUrl).toHaveBeenCalledTimes(1)
	})

	it("returns 413 when fileSize exceeds max", async () => {
		const response = await handler(
			apiEvent({
				body: JSON.stringify({
					clientClipId: "client-1",
					fileName: "big.mp3",
					contentType: "audio/mpeg",
					fileSize: 20 * 1024 * 1024,
				}),
			}),
		)

		expect(response.statusCode).toBe(413)
		expect(JSON.parse(response.body).maxUploadBytes).toBe(10485760)
		expect(mockDocSend).not.toHaveBeenCalled()
	})

	it("returns 400 for disallowed content type", async () => {
		const response = await handler(
			apiEvent({
				body: JSON.stringify({
					clientClipId: "client-1",
					fileName: "doc.pdf",
					contentType: "application/pdf",
					fileSize: 100,
				}),
			}),
		)

		expect(response.statusCode).toBe(400)
		expect(JSON.parse(response.body).message).toMatch(/audio type/)
	})

	it("returns 400 when required fields are missing", async () => {
		const response = await handler(
			apiEvent({
				body: JSON.stringify({ fileName: "meow.mp3" }),
			}),
		)

		expect(response.statusCode).toBe(400)
		expect(JSON.parse(response.body).message).toMatch(/clientClipId/)
	})

	it("returns 409 on DynamoDB conditional check failure", async () => {
		const error = new Error("exists")
		error.name = "ConditionalCheckFailedException"
		mockDocSend.mockRejectedValue(error)

		const response = await handler(apiEvent())

		expect(response.statusCode).toBe(409)
		expect(JSON.parse(response.body).message).toMatch(/already exists/)
	})
})
