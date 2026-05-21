"use client"

import { useRef, useState } from "react"

import styles from "./page.module.css"
import {
	requestUploadUrl,
	uploadRawAudio,
	getClipResult,
	GetClipResultResponse,
} from "@/lib/uploads"

type UploadControlProps = {
	onFileSelected?: (file: File) => void
}

type UploadPhase =
	| "idle"
	| "requesting_upload_url"
	| "uploading_audio"
	| "getting_clip_result"
	| "success"
	| "error"

const TERMINAL_CLIP_STATUSES = new Set(["COMPLETE", "FAILED"])
const UPLOAD_PROGRESS_BY_PHASE: Record<UploadPhase, number> = {
	idle: 0,
	requesting_upload_url: 25,
	uploading_audio: 50,
	getting_clip_result: 75,
	success: 100,
	error: 100,
}

export function UploadControl({ onFileSelected }: UploadControlProps) {
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)

	// Get Clip Result
	const [getClipResultRequest, setGetClipResultRequest] =
		useState<GetClipResultResponse | null>(null)

	// Combined Upload
	const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle")
	const [uploadStatusMessage, setUploadStatusMessage] = useState("")
	const [uploadError, setUploadError] = useState<string | null>(null)
	const uploadProgress = UPLOAD_PROGRESS_BY_PHASE[uploadPhase]
	const progressFillClassName =
		uploadPhase === "success"
			? styles.progressFillSuccess
			: uploadPhase === "error"
			? styles.progressFillError
			: styles.progressFillActive

	function resetUploadState(options?: { clearSelectedFile?: boolean }) {
		setGetClipResultRequest(null)
		setUploadPhase("idle")
		setUploadStatusMessage("")
		setUploadError(null)

		if (options?.clearSelectedFile) {
			setSelectedFile(null)
			if (fileInputRef.current) {
				fileInputRef.current.value = ""
			}
		}
	}

	function handleBrowseClick() {
		fileInputRef.current?.click()
	}

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0] ?? null

		resetUploadState()
		setSelectedFile(file)

		if (file) {
			onFileSelected?.(file)
		}
	}

	function handleResetClick() {
		resetUploadState({ clearSelectedFile: true })
	}

	async function handleUploadClick() {
		if (!selectedFile) return

		setUploadPhase("requesting_upload_url")
		setUploadStatusMessage("Requesting upload URL...")
		setUploadError(null)

		try {
			const uploadRequest = await requestUploadUrl({
				clientClipId: crypto.randomUUID(),
				fileName: selectedFile.name,
				contentType: selectedFile.type || "audio/mpeg",
			})

			setUploadPhase("uploading_audio")
			setUploadStatusMessage("Uploading raw audio...")
			await uploadRawAudio({
				uploadUrl: uploadRequest.uploadUrl,
				file: selectedFile,
			})

			setUploadPhase("getting_clip_result")
			setUploadStatusMessage("Getting clip result...")

			let clipResult = await getClipResult({
				clipId: uploadRequest.clipId,
			})
			setGetClipResultRequest(clipResult)

			while (!TERMINAL_CLIP_STATUSES.has(clipResult.clipStatus)) {
				await new Promise((resolve) => setTimeout(resolve, 2000))

				clipResult = await getClipResult({
					clipId: uploadRequest.clipId,
				})
				setGetClipResultRequest(clipResult)
			}

			setUploadPhase("success")
			setUploadStatusMessage("Upload flow completed.")
		} catch (error) {
			setUploadPhase("error")
			setUploadError(
				error instanceof Error ? error.message : "Unexpected error",
			)
			setUploadStatusMessage("")
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
							onClick={handleUploadClick}
							disabled={uploadPhase !== "idle"}
						>
							Upload audio file
						</button>
						<button
							type="button"
							className={styles.secondaryButton}
							onClick={handleResetClick}
						>
							Reset
						</button>
					</>
				)}
			</div>
			{selectedFile && uploadPhase !== "idle" && (
				<div className={styles.uploadStatus}>
					<div className={styles.progressBar} aria-hidden="true">
						<div
							className={`${styles.progressFill} ${progressFillClassName}`}
							style={{ width: `${uploadProgress}%` }}
						/>
					</div>
					<p>{uploadStatusMessage}</p>
					{uploadError && (
						<p className={styles.errorText}>Error: {uploadError}</p>
					)}
				</div>
			)}
			{getClipResultRequest && uploadPhase === "success" && (
				<p className={styles.successText}>
					Cat Breed:{" "}
					{getClipResultRequest.identifiedBreed != null
						? getClipResultRequest.identifiedBreed
						: "Unknown"}{" "}
				</p>
			)}
			{getClipResultRequest?.identifiedBreed && (
				<p className={styles.successText}>
					{"Confidence: " +
						(getClipResultRequest.confidenceScore !== null
							? `${(getClipResultRequest.confidenceScore * 100).toFixed(2)}%`
							: "N/A")}
				</p>
			)}
			{uploadPhase === "error" && (
				<p className={styles.errorText}>An error occurred: {uploadError}</p>
			)}
		</div>
	)
}
