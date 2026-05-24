import { config } from "./config"

if (!config.apiBaseUrl) {
	throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.")
}

/** Matches backend MaxUploadSizeBytes (10 MiB). Shown to users as MB. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
export const MAX_UPLOAD_SIZE_MB = 10

const TERMINAL_CLIP_STATUSES = new Set(["COMPLETE", "FAILED"])

const POLL_INITIAL_INTERVAL_MS = 2000
const POLL_MAX_INTERVAL_MS = 8000
const POLL_BACKOFF_FACTOR = 1.5
const POLL_MAX_ATTEMPTS = 20
const POLL_MAX_TOTAL_MS = 90_000

type ApiErrorContext = "uploadUrl" | "clipResult" | "audioUpload"

export class UserFacingUploadError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "UserFacingUploadError"
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function isSafeServerMessage(message: string): boolean {
	if (message.length > 160) return false
	if (/arn:|aws:|exception|error:|stack|\.js:\d/i.test(message)) {
		return false
	}
	return true
}

function toUserFacingHttpError(
	status: number,
	errorBody: { message?: string } | null,
	context: ApiErrorContext,
): string {
	switch (status) {
		case 429:
			return "Too many requests. Please wait a moment and try again."
		case 413:
			return `This file is over ${MAX_UPLOAD_SIZE_MB} MB. Please choose a smaller audio file.`
		case 400:
			if (errorBody?.message && isSafeServerMessage(errorBody.message)) {
				return errorBody.message
			}
			return "That request was not valid. Check your file and try again."
		case 404:
			return context === "clipResult"
				? "We could not find that clip. Try uploading again."
				: "That resource was not found."
		case 403:
			return "Access was denied. Please try again later."
		case 502:
		case 503:
		case 504:
			return "The service is temporarily unavailable. Please try again in a moment."
		case 500:
		default:
			if (context === "uploadUrl") {
				return "Could not start the upload. Please try again in a moment."
			}
			if (context === "clipResult") {
				return "Could not load the clip result. Please try again in a moment."
			}
			return "Something went wrong. Please try again in a moment."
	}
}

function toUserFacingNetworkError(context: ApiErrorContext): string {
	if (context === "audioUpload") {
		return "Could not upload your audio file. Check your connection and try again."
	}
	if (context === "clipResult") {
		return "Could not reach the server while checking your result. Please try again."
	}
	return "Could not reach the server. Check your connection and try again."
}

function throwUserFacing(error: unknown, context: ApiErrorContext): never {
	if (error instanceof UserFacingUploadError) {
		throw error
	}
	throw new UserFacingUploadError(toUserFacingNetworkError(context))
}

export function getAudioFileValidationError(file: File): string | null {
	if (!file.type || !file.type.startsWith("audio/")) {
		return "Please choose a file with a recognized audio type."
	}
	if (file.size > MAX_UPLOAD_BYTES) {
		return `This file is over ${MAX_UPLOAD_SIZE_MB} MB. Please choose a smaller audio file.`
	}
	return null
}

export type RequestUploadUrlRequest = {
	clientClipId: string
	fileName: string
	contentType: string
	fileSize: number
}

export type UploadRawAudioRequest = {
	uploadUrl: string
	file: File
	/** Must match the Content-Type used when the presigned URL was created. */
	contentType: string
}

export type GetClipResultRequest = {
	clipId: string
}

export type RequestUploadUrlResponse = {
	clipId: string
	clientClipId: string
	clipStatus: string
	s3Key: string
	contentType: string
	uploadUrl: string
	uploadUrlExpiresInSeconds: number
}

export type GetClipResultResponse = {
	clientClipId: string
	clipId: string
	clipStatus: string
	confidenceScore: number | null
	createdAt: Date
	identifiedBreed: string | null
	processedAt: Date | null
	s3Key: string
}

export async function requestUploadUrl(
	payload: RequestUploadUrlRequest,
): Promise<RequestUploadUrlResponse> {
	try {
		const response = await fetch(`${config.apiBaseUrl}/uploads`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		})

		if (!response.ok) {
			const errorBody = await response.json().catch(() => null)
			throw new UserFacingUploadError(
				toUserFacingHttpError(response.status, errorBody, "uploadUrl"),
			)
		}

		return response.json()
	} catch (error) {
		throwUserFacing(error, "uploadUrl")
	}
}

export async function uploadRawAudio(
	payload: UploadRawAudioRequest,
): Promise<void> {
	try {
		const response = await fetch(payload.uploadUrl, {
			method: "PUT",
			headers: {
				"Content-Type": payload.contentType,
			},
			body: payload.file,
		})

		if (!response.ok) {
			if (response.status === 429) {
				throw new UserFacingUploadError(
					"Too many requests. Please wait a moment and try again.",
				)
			}
			throw new UserFacingUploadError(
				"Could not upload your audio file. Please try again in a moment.",
			)
		}
	} catch (error) {
		throwUserFacing(error, "audioUpload")
	}
}

export async function getClipResult(
	payload: GetClipResultRequest,
): Promise<GetClipResultResponse> {
	try {
		const response = await fetch(
			`${config.apiBaseUrl}/clips/${payload.clipId}`,
			{
				method: "GET",
			},
		)

		if (!response.ok) {
			const errorBody = await response.json().catch(() => null)
			throw new UserFacingUploadError(
				toUserFacingHttpError(response.status, errorBody, "clipResult"),
			)
		}

		return response.json()
	} catch (error) {
		throwUserFacing(error, "clipResult")
	}
}

/**
 * Polls GET /clips/{clipId} with exponential backoff until COMPLETE or FAILED.
 */
export async function pollClipResult(
	clipId: string,
	options?: {
		onPoll?: (result: GetClipResultResponse) => void
	},
): Promise<GetClipResultResponse> {
	const startedAt = Date.now()
	let intervalMs = POLL_INITIAL_INTERVAL_MS
	let attempts = 0

	while (true) {
		const result = await getClipResult({ clipId })
		options?.onPoll?.(result)

		if (TERMINAL_CLIP_STATUSES.has(result.clipStatus)) {
			return result
		}

		attempts += 1
		if (attempts >= POLL_MAX_ATTEMPTS) {
			throw new UserFacingUploadError(
				"Processing is taking longer than expected. Please try again in a moment.",
			)
		}

		const elapsed = Date.now() - startedAt
		if (elapsed >= POLL_MAX_TOTAL_MS) {
			throw new UserFacingUploadError(
				"Processing is taking longer than expected. Please try again in a moment.",
			)
		}

		const waitMs = Math.min(intervalMs, POLL_MAX_TOTAL_MS - elapsed)
		await sleep(waitMs)
		intervalMs = Math.min(
			POLL_MAX_INTERVAL_MS,
			Math.round(intervalMs * POLL_BACKOFF_FACTOR),
		)
	}
}
