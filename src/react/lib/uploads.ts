import { config } from "./config"

//fetch(`${config.apiBaseUrl}/uploads`, ...)
//const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

if (!config.apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.")
}

export type RequestUploadUrlRequest = {
    clientClipId: string
    fileName: string
    contentType: string
}

export type RequestUploadUrlResponse = {
    clipId: string
    clientClipId: string
    clipStatus: string
    s3Key: string
    uploadUrl: string
    uploadUrlExpiresInSeconds: number
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
        throw new Error(errorBody?.message ?? "Failed to request upload URL.")
    }

    return response.json()
}