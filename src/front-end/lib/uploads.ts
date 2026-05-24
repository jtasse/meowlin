import { config } from "./config"

//fetch(`${config.apiBaseUrl}/uploads`, ...)
//const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

if (!config.apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.")
}

/** Matches backend MaxUploadSizeBytes (10 MiB). Shown to users as MB. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
export const MAX_UPLOAD_SIZE_MB = 10

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

export type UploadRawAudioResponse = {
    success: boolean
    message?: string
}

export type GetClipResultResponse = {
    clientClipId: string
    clipId: string
    clipStatus: string
    confidenceScore: number | null,
    createdAt: Date,
    identifiedBreed: string | null,
    processedAt: Date | null,
    s3Key: string
}

export async function requestUploadUrl(
    payload: RequestUploadUrlRequest,
): Promise<RequestUploadUrlResponse> {
    const response = await fetch(
        `${config.apiBaseUrl}/uploads`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        },
    )

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        if (response.status === 413) {
            throw new Error(
                `This file is over ${MAX_UPLOAD_SIZE_MB} MB. Please choose a smaller audio file.`,
            )
        }
        throw new Error(errorBody?.message ?? "Failed to request upload URL.")
    }

    return response.json()
}

export async function uploadRawAudio(
    payload: UploadRawAudioRequest
): Promise<void> {
    const response = await fetch(payload.uploadUrl, {
        method: "PUT",
        headers: {
            "Content-Type": payload.contentType,
        },
        body: payload.file,
    })

    if (!response.ok) {
        const errorBody = await response.text().catch(() => "")
        throw new Error(errorBody || "Failed to upload raw audio.")
    }
}

export async function getClipResult(
    payload: GetClipResultRequest,
): Promise<GetClipResultResponse> {
    const response = await fetch(
        `${config.apiBaseUrl}/clips/${payload.clipId}`,
        {
            method: "GET",
        },
    )

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.message ?? "Failed to get clip result.")
    }

    return response.json()
}