"use client"

import { useRef, useState } from "react"

import styles from "./page.module.css"
import {
	uploadRawAudio,
	RequestUploadUrlResponse,
	requestUploadUrl,
} from "@/lib/uploads"

type UploadControlProps = {
	onFileSelected?: (file: File) => void
}

export function UploadControl({ onFileSelected }: UploadControlProps) {
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)

	// Request Upload URL
	const [requestUploadRequestState, setRequestUploadState] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle")
	const [requestUploadRequest, setRequestUploadResult] =
		useState<RequestUploadUrlResponse | null>(null)
	const [isRequestingUploadUrl, setIsRequestingUploadUrl] =
		useState<boolean>(false)
	const [requestError, setRequestUploadError] = useState<string | null>(null)

	// Upload Raw Audio
	const [uploadRawAudioRequestState, setUploadRawAudioRequestState] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle")
	const [uploadRawAudioRequestError, setUploadRawAudioRequestError] = useState<
		string | null
	>(null)
	const [isRawAudioUploading, setIsRawAudioUploading] = useState<boolean>(false)
	const [uploadProgress, setUploadProgress] = useState<number>(0)
	function handleBrowseClick() {
		fileInputRef.current?.click()
	}

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0] ?? null
		setSelectedFile(file)

		if (file) {
			onFileSelected?.(file)
		}
	}

	async function handleRequestUploadClick() {
		if (!selectedFile) return

		setRequestUploadState("loading")
		setRequestUploadError(null)
		setRequestUploadResult(null)
		setIsRequestingUploadUrl(true)

		try {
			const requestUploadResult = await requestUploadUrl({
				clientClipId: crypto.randomUUID(),
				fileName: selectedFile.name,
				contentType: selectedFile.type || "audio/mpeg",
			})

			setRequestUploadResult(requestUploadResult)
			setRequestUploadState("success")
		} catch (error) {
			setRequestUploadState("error")
			setRequestUploadError(
				error instanceof Error ? error.message : "Unexpected error",
			)
		} finally {
			setIsRequestingUploadUrl(false)
		}
	}

	async function handleUploadRawAudioClick() {
		if (!selectedFile || !requestUploadRequest) return

		setUploadRawAudioRequestState("loading")
		setUploadRawAudioRequestError(null)
		setIsRawAudioUploading(true)

		try {
			await uploadRawAudio({
				uploadUrl: requestUploadRequest.uploadUrl,
				file: selectedFile,
			})

			setUploadRawAudioRequestState("success")
		} catch (error) {
			setUploadRawAudioRequestState("error")
			setUploadRawAudioRequestError(
				error instanceof Error ? error.message : "Unexpected error",
			)
		} finally {
			setIsRawAudioUploading(false)
		}
	}

	return (
		<div className={styles.uploadControl}>
			<button
				type="button"
				onClick={handleBrowseClick}
				className={styles.uploadButton}
			>
				Choose audio file
			</button>

			<input
				ref={fileInputRef}
				type="file"
				accept="audio/*"
				onChange={handleFileChange}
				className="hidden"
			/>

			<p className={styles.uploadStatus}>
				{selectedFile
					? `Selected file: ${selectedFile.name}`
					: "Choose an audio sample to begin the upload flow."}
			</p>

			<div className={styles.uploadActions}>
				{selectedFile && (
					<>
						<button
							type="button"
							className={styles.secondaryButton}
							onClick={handleRequestUploadClick}
							disabled={
								isRequestingUploadUrl ||
								isRawAudioUploading ||
								requestUploadRequestState === "loading"
							}
						>
							Request Upload URL
						</button>
						<div className={styles.progressBar}>
							<div
								className={styles.progressFill}
								style={{ width: `${uploadProgress}%` }}
							/>
						</div>
					</>
				)}
			</div>
			<p className={styles.uploadStatus}>
				{isRequestingUploadUrl ? "Requesting upload URL..." : ""}
			</p>
			{requestUploadRequestState === "error" && (
				<p className={styles.errorText}>
					Error requesting upload URL: {requestError}
				</p>
			)}
			{requestUploadRequestState === "success" && requestUploadRequest && (
				<div className={styles.requestResult}>
					<p>Upload URL receieved!</p>
					<p>Clip ID: {requestUploadRequest.clipId}</p>
					<p>Client Clip ID: {requestUploadRequest.clientClipId}</p>
					<p>Clip Status: {requestUploadRequest.clipStatus}</p>
					<p>S3 Key: {requestUploadRequest.s3Key}</p>
					<p>Upload URL: {requestUploadRequest.uploadUrl}</p>
					<p>
						Upload URL Expires In:{" "}
						{requestUploadRequest.uploadUrlExpiresInSeconds} seconds
					</p>
				</div>
			)}
			<div>
				{requestUploadRequestState === "success" && requestUploadRequest && (
					<>
						<button
							type="button"
							className={styles.secondaryButton}
							onClick={handleUploadRawAudioClick}
							disabled={
								isRequestingUploadUrl ||
								isRawAudioUploading ||
								uploadRawAudioRequestState === "loading"
							}
						>
							Upload Raw Audio
						</button>
						<div className={styles.progressBar}>
							<div
								className={styles.progressFill}
								style={{ width: `${uploadProgress}%` }}
							/>
						</div>
					</>
				)}
				<p className={styles.uploadStatus}>
					{isRawAudioUploading ? "Uploading raw audio..." : ""}
				</p>
				{uploadRawAudioRequestState === "error" && (
					<p className={styles.errorText}>
						Error uploading raw audio: {uploadRawAudioRequestError}
					</p>
				)}
				{uploadRawAudioRequestState === "success" && (
					<p className={styles.successText}>Raw audio uploaded successfully!</p>
				)}
			</div>
		</div>
	)
}
