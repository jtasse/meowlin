"use client"

import { useRef, useState } from "react"

import styles from "./page.module.css"
import { requestUploadUrl, RequestUploadUrlResponse } from "@/lib/uploads"

type UploadControlProps = {
	onFileSelected?: (file: File) => void
}

export function UploadControl({ onFileSelected }: UploadControlProps) {
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [isRequestingUploadUrl, setIsRequestingUploadUrl] =
		useState<boolean>(false)
	const [isUploading, setIsUploading] = useState<boolean>(false)
	const [uploadProgress, setUploadProgress] = useState<number>(0)

	const [requestState, setRequestState] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle")
	const [uploadRequest, setUploadRequest] =
		useState<RequestUploadUrlResponse | null>(null)
	const [requestError, setRequestError] = useState<string | null>(null)

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

	function handleUploadClick() {
		if (selectedFile) {
			setIsUploading(true)
			// TODO: Implement upload logic
		}
	}

	async function handleRequestUploadClick() {
		if (!selectedFile) return

		setRequestState("loading")
		setRequestError(null)
		setUploadRequest(null)
		setIsRequestingUploadUrl(true)

		try {
			const result = await requestUploadUrl({
				clientClipId: crypto.randomUUID(),
				fileName: selectedFile.name,
				contentType: selectedFile.type || "audio/mpeg",
			})

			setUploadRequest(result)
			setRequestState("success")
		} catch (error) {
			setRequestState("error")
			setRequestError(
				error instanceof Error ? error.message : "Unexpected error",
			)
		} finally {
			setIsRequestingUploadUrl(false)
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
								isUploading ||
								requestState === "loading"
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
			{requestState === "error" && (
				<p className={styles.errorText}>
					Error requesting upload URL: {requestError}
				</p>
			)}
			{requestState === "success" && uploadRequest && (
				<div className={styles.requestResult}>
					<p>Upload URL requested successfully!</p>
					<p>Clip ID: {uploadRequest.clipId}</p>
					<p>Client Clip ID: {uploadRequest.clientClipId}</p>
					<p>Clip Status: {uploadRequest.clipStatus}</p>
					<p>S3 Key: {uploadRequest.s3Key}</p>
					<p>
						Upload URL Expires In: {uploadRequest.uploadUrlExpiresInSeconds}{" "}
						seconds
					</p>
				</div>
			)}
		</div>
	)
}
