import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
	MAX_UPLOAD_BYTES,
	MAX_UPLOAD_SIZE_MB,
	UserFacingUploadError,
	getAudioFileValidationError,
	getClipResult,
	pollClipResult,
	requestUploadUrl,
	uploadRawAudio,
} from "./uploads"

function jsonResponse(body: unknown, status = 200): Response {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: () => Promise.resolve(body),
	} as Response
}

function audioFile(overrides: Partial<File> & { size?: number; type?: string } = {}) {
	return {
		size: overrides.size ?? 1024,
		type: overrides.type ?? "audio/mpeg",
	} as File
}

describe("getAudioFileValidationError", () => {
	it("accepts audio files within size limit", () => {
		expect(getAudioFileValidationError(audioFile())).toBeNull()
	})

	it("rejects non-audio types", () => {
		expect(getAudioFileValidationError(audioFile({ type: "video/mp4" }))).toMatch(
			/audio type/,
		)
	})

	it("rejects files over max size", () => {
		expect(
			getAudioFileValidationError(
				audioFile({ size: MAX_UPLOAD_BYTES + 1 }),
			),
		).toContain(String(MAX_UPLOAD_SIZE_MB))
	})
})

describe("requestUploadUrl", () => {
	let fetchMock: ReturnType<typeof vi.fn>

	beforeEach(() => {
		fetchMock = vi.fn()
		vi.stubGlobal("fetch", fetchMock)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it("returns parsed JSON on success", async () => {
		const body = {
			clipId: "clip-1",
			clientClipId: "client-1",
			clipStatus: "PENDING_UPLOAD",
			uploadUrl: "https://s3.example/upload",
		}
		fetchMock.mockResolvedValue(jsonResponse(body))

		const result = await requestUploadUrl({
			clientClipId: "client-1",
			fileName: "meow.mp3",
			contentType: "audio/mpeg",
			fileSize: 1024,
		})

		expect(result).toEqual(body)
		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.test.example/prod/uploads",
			expect.objectContaining({ method: "POST" }),
		)
	})

	it("throws user-safe message for 429", async () => {
		fetchMock.mockResolvedValue(jsonResponse({}, 429))

		await expect(
			requestUploadUrl({
				clientClipId: "c",
				fileName: "meow.mp3",
				contentType: "audio/mpeg",
				fileSize: 100,
			}),
		).rejects.toMatchObject({
			name: "UserFacingUploadError",
			message: "Too many requests. Please wait a moment and try again.",
		})
	})

	it("throws user-safe message for 413", async () => {
		fetchMock.mockResolvedValue(jsonResponse({}, 413))

		await expect(
			requestUploadUrl({
				clientClipId: "c",
				fileName: "meow.mp3",
				contentType: "audio/mpeg",
				fileSize: 100,
			}),
		).rejects.toThrow(/over 10 MB/)
	})

	it("maps network failures to user-safe errors", async () => {
		fetchMock.mockRejectedValue(new TypeError("Failed to fetch"))

		await expect(
			requestUploadUrl({
				clientClipId: "c",
				fileName: "meow.mp3",
				contentType: "audio/mpeg",
				fileSize: 100,
			}),
		).rejects.toMatchObject({
			name: "UserFacingUploadError",
			message: "Could not reach the server. Check your connection and try again.",
		})
	})
})

describe("uploadRawAudio", () => {
	let fetchMock: ReturnType<typeof vi.fn>

	beforeEach(() => {
		fetchMock = vi.fn()
		vi.stubGlobal("fetch", fetchMock)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it("PUTs file bytes to presigned URL", async () => {
		fetchMock.mockResolvedValue(jsonResponse(null, 200))
		const file = audioFile()

		await uploadRawAudio({
			uploadUrl: "https://s3.example/presigned",
			file,
			contentType: "audio/mpeg",
		})

		expect(fetchMock).toHaveBeenCalledWith(
			"https://s3.example/presigned",
			expect.objectContaining({
				method: "PUT",
				body: file,
				headers: { "Content-Type": "audio/mpeg" },
			}),
		)
	})
})

describe("getClipResult", () => {
	let fetchMock: ReturnType<typeof vi.fn>

	beforeEach(() => {
		fetchMock = vi.fn()
		vi.stubGlobal("fetch", fetchMock)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it("returns 404 user message for missing clips", async () => {
		fetchMock.mockResolvedValue(jsonResponse({ message: "Clip not found." }, 404))

		await expect(getClipResult({ clipId: "missing" })).rejects.toMatchObject({
			name: "UserFacingUploadError",
			message: "We could not find that clip. Try uploading again.",
		})
	})
})

describe("pollClipResult", () => {
	let fetchMock: ReturnType<typeof vi.fn>

	beforeEach(() => {
		vi.useFakeTimers()
		fetchMock = vi.fn()
		vi.stubGlobal("fetch", fetchMock)
	})

	afterEach(() => {
		vi.useRealTimers()
		vi.unstubAllGlobals()
	})

	it("polls until clip status is terminal", async () => {
		const complete = {
			clipId: "clip-1",
			clipStatus: "COMPLETE",
			identifiedBreed: "Siamese",
			confidenceScore: 0.9,
		}
		fetchMock
			.mockResolvedValueOnce(
				jsonResponse({ clipId: "clip-1", clipStatus: "PROCESSING" }),
			)
			.mockResolvedValueOnce(jsonResponse(complete))

		const onPoll = vi.fn()
		const resultPromise = pollClipResult("clip-1", { onPoll })
		await vi.advanceTimersByTimeAsync(2000)
		const result = await resultPromise

		expect(result).toEqual(complete)
		expect(onPoll).toHaveBeenCalledTimes(2)
		expect(fetchMock).toHaveBeenCalledTimes(2)
	})

	it("throws after max attempts", async () => {
		fetchMock.mockResolvedValue(
			jsonResponse({ clipId: "clip-1", clipStatus: "PROCESSING" }),
		)

		const resultPromise = pollClipResult("clip-1")
		const assertion = expect(resultPromise).rejects.toThrow(
			"Processing is taking longer than expected. Please try again in a moment.",
		)
		await vi.runAllTimersAsync()
		await assertion
	})

	it("rethrows UserFacingUploadError from getClipResult", async () => {
		fetchMock.mockResolvedValue(jsonResponse({}, 503))

		await expect(pollClipResult("clip-1")).rejects.toBeInstanceOf(
			UserFacingUploadError,
		)
	})
})
