"use client"

import { useRef, useState } from "react"

import styles from "./page.module.css"
import {
	requestUploadUrl,
	uploadRawAudio,
	getClipResult,
	GetClipResultResponse,
} from "@/lib/uploads"
import { RevealBackground } from "./RevealBackground"
import { WhatsThatCatBreed } from "./WhatsThatCatBreed"

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

	const [getClipResultRequest, setGetClipResultRequest] =
		useState<GetClipResultResponse | null>(null)

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

	const showReveal = uploadPhase !== "idle"
	const revealComplete = uploadPhase === "success"

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
		if (selectedFile) {
			handleResetClick()
			return
		}
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
			setUploadStatusMessage("Breed identification completed.")
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
			<div className={styles.uploadUiLayer}>
			<div className={styles.stepRow}>
				<div className={styles.stepBox}>
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
					<p className={styles.stepHint}>
						{selectedFile
							? `Selected: ${selectedFile.name}`
							: "Choose an audio sample to begin."}
					</p>
				</div>

				{selectedFile && (
					<>
						<span className={styles.stepArrow} aria-hidden="true">
							→
						</span>
						<div className={styles.stepBox}>
							<button
								type="button"
								className={styles.uploadButton}
								onClick={handleUploadClick}
								disabled={uploadPhase !== "idle"}
							>
								Upload
							</button>
							<p className={styles.stepHint}>
								Upload your clip for breed identification.
							</p>
						</div>

						<div className={`${styles.stepBox} ${styles.stepBoxReset}`}>
							<button
								type="button"
								className={`${styles.uploadButton} ${styles.resetAside}`}
								onClick={handleResetClick}
							>
								Reset
							</button>
						</div>
					</>
				)}
			</div>

			{showReveal && (
				<div className={styles.statusPanel}>
					<div className={styles.progressBar} aria-hidden="true">
						<div
							className={`${styles.progressFill} ${progressFillClassName}`}
							style={{ width: `${uploadProgress}%` }}
						/>
					</div>
					{uploadStatusMessage && (
						<p className={styles.progressStatus}>{uploadStatusMessage}</p>
					)}
					{uploadError && (
						<p className={styles.errorText}>{uploadError}</p>
					)}
				</div>
			)}
			</div>

			{showReveal && (
				<div className={styles.revealLayer}>
					<RevealBackground />
					<div className={styles.revealGuessPanel} aria-hidden="true" />
					<WhatsThatCatBreed
						revealed={revealComplete}
						identifiedBreed={
							revealComplete
								? (getClipResultRequest?.identifiedBreed ?? null)
								: null
						}
						confidenceScore={
							revealComplete
								? getClipResultRequest?.confidenceScore ?? null
								: null
						}
					/>
				</div>
			)}
		</div>
	)
}
