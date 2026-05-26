"use client"

import { useEffect, useRef, useState } from "react"

import styles from "./page.module.css"
import { loadDemoSampleFile } from "@/lib/demoSample"
import {
	focusNextOnMobile,
	scrollStepIntoView,
} from "@/lib/focusNextOnMobile"
import {
	requestUploadUrl,
	uploadRawAudio,
	pollClipResult,
	getAudioFileValidationError,
	GetClipResultResponse,
} from "@/lib/uploads"
import { HowItWorksDrawer } from "./HowItWorksDrawer"
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
	const step2ColumnRef = useRef<HTMLDivElement>(null)
	const uploadButtonRef = useRef<HTMLButtonElement>(null)
	const revealLayerRef = useRef<HTMLDivElement>(null)
	const resultsHostRef = useRef<HTMLDivElement>(null)
	const uploadScrollStartedRef = useRef(false)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)

	const [getClipResultRequest, setGetClipResultRequest] =
		useState<GetClipResultResponse | null>(null)

	const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle")
	const [uploadStatusMessage, setUploadStatusMessage] = useState("")
	const [uploadError, setUploadError] = useState<string | null>(null)
	const [isLoadingDemoSample, setIsLoadingDemoSample] = useState(false)
	const uploadProgress = UPLOAD_PROGRESS_BY_PHASE[uploadPhase]
	const progressFillClassName =
		uploadPhase === "success"
			? styles.progressFillSuccess
			: uploadPhase === "error"
				? styles.progressFillError
				: styles.progressFillActive

	const showReveal = uploadPhase !== "idle"
	const revealComplete = uploadPhase === "success"
	const step1Current = !selectedFile
	const step2Current = Boolean(selectedFile) && uploadPhase === "idle"
	const stepSlotsPending = !selectedFile

	useEffect(() => {
		if (!selectedFile || uploadPhase !== "idle") return

		const frame = requestAnimationFrame(() => {
			focusNextOnMobile(step2ColumnRef.current, uploadButtonRef.current)
		})
		return () => cancelAnimationFrame(frame)
	}, [selectedFile, uploadPhase])

	useEffect(() => {
		if (uploadPhase === "idle") {
			uploadScrollStartedRef.current = false
			return
		}

		if (uploadScrollStartedRef.current) return
		uploadScrollStartedRef.current = true

		const frame = requestAnimationFrame(() => {
			scrollStepIntoView(revealLayerRef.current, { block: "end" })
		})
		return () => cancelAnimationFrame(frame)
	}, [uploadPhase])

	useEffect(() => {
		if (uploadPhase !== "success") return

		const frame = requestAnimationFrame(() => {
			scrollStepIntoView(resultsHostRef.current)
		})
		return () => cancelAnimationFrame(frame)
	}, [uploadPhase])

	function resetUploadState(options?: { clearSelectedFile?: boolean }) {
		setGetClipResultRequest(null)
		setUploadPhase("idle")
		setUploadStatusMessage("")
		setUploadError(null)

		if (options?.clearSelectedFile) {
			setSelectedFile(null)
			setIsLoadingDemoSample(false)
			if (fileInputRef.current) {
				fileInputRef.current.value = ""
			}
		}
	}

	function handleChooseYourOwnClick() {
		fileInputRef.current?.click()
	}

	async function handleUseDemoSampleClick() {
		resetUploadState({ clearSelectedFile: true })
		setIsLoadingDemoSample(true)
		setUploadError(null)

		try {
			const file = await loadDemoSampleFile()
			const validationError = getAudioFileValidationError(file)
			if (validationError) {
				setUploadError(validationError)
				return
			}
			setSelectedFile(file)
			onFileSelected?.(file)
		} catch (error) {
			setUploadError(
				error instanceof Error
					? error.message
					: "Could not load the demo sample. Please try again.",
			)
		} finally {
			setIsLoadingDemoSample(false)
		}
	}

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0] ?? null

		resetUploadState()

		if (!file) {
			setSelectedFile(null)
			return
		}

		const validationError = getAudioFileValidationError(file)
		if (validationError) {
			setUploadError(validationError)
			setSelectedFile(null)
			if (fileInputRef.current) {
				fileInputRef.current.value = ""
			}
			return
		}

		setSelectedFile(file)
		onFileSelected?.(file)
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
			const validationError = getAudioFileValidationError(selectedFile)
			if (validationError) {
				throw new Error(validationError)
			}

			const uploadRequest = await requestUploadUrl({
				clientClipId: crypto.randomUUID(),
				fileName: selectedFile.name,
				contentType: selectedFile.type,
				fileSize: selectedFile.size,
			})

			setUploadPhase("uploading_audio")
			setUploadStatusMessage("Uploading raw audio...")
			await uploadRawAudio({
				uploadUrl: uploadRequest.uploadUrl,
				file: selectedFile,
				contentType: uploadRequest.contentType,
			})

			setUploadPhase("getting_clip_result")
			setUploadStatusMessage("Getting clip result...")

			const clipResult = await pollClipResult(uploadRequest.clipId, {
				onPoll: (result) => setGetClipResultRequest(result),
			})
			setGetClipResultRequest(clipResult)

			setUploadPhase("success")
			setUploadStatusMessage("Breed identification completed.")
		} catch (error) {
			setUploadPhase("error")
			setUploadError(
				error instanceof Error
					? error.message
					: "Something went wrong. Please try again in a moment.",
			)
			setUploadStatusMessage("")
		}
	}

	return (
		<div className={styles.uploadControl}>
			<HowItWorksDrawer />

			<div className={styles.uploadUiLayer}>
				<div
					className={`${styles.stepRow} ${selectedFile ? styles.stepRowReady : ""}`}
				>
					<div className={`${styles.stepColumn} ${styles.stepColumnChoose}`}>
						<div
							className={`${styles.stepBox} ${step1Current ? styles.stepBoxCurrent : ""}`}
						>
							<p className={styles.stepHeading}>Step 1: Choose audio to upload</p>
							<div className={styles.stepChooseStack}>
								<button
									type="button"
									onClick={handleUseDemoSampleClick}
									className={styles.uploadButton}
									disabled={isLoadingDemoSample || uploadPhase !== "idle"}
								>
									{isLoadingDemoSample
										? "Loading sample…"
										: "Use demo sample"}
								</button>
								<span className={styles.stepOr} aria-hidden="true">
									OR
								</span>
								<button
									type="button"
									onClick={handleChooseYourOwnClick}
									className={`${styles.uploadButton} ${styles.uploadButtonStacked}`}
									disabled={isLoadingDemoSample || uploadPhase !== "idle"}
								>
									<span>Choose your own</span>
									<span className={styles.uploadButtonSubtext}>
										(10 MB max)
									</span>
								</button>
							</div>
							<input
								ref={fileInputRef}
								type="file"
								accept="audio/*"
								onChange={handleFileChange}
								className="hidden"
							/>
							{uploadError && !showReveal && (
								<p className={styles.errorText} role="alert">
									{uploadError}
								</p>
							)}
						</div>
						{selectedFile && (
							<p className={styles.stepFootnote}>
								Selected file: {selectedFile.name}
							</p>
						)}
					</div>

					<span
						className={`${styles.stepArrow} ${stepSlotsPending ? styles.stepSlotPending : ""}`}
						aria-hidden="true"
					>
						→
					</span>
					<div
						ref={step2ColumnRef}
						className={`${styles.stepColumn} ${stepSlotsPending ? styles.stepSlotPending : ""}`}
						aria-hidden={stepSlotsPending}
					>
						<div
							className={`${styles.stepBox} ${styles.stepBoxUpload} ${step2Current ? styles.stepBoxCurrent : ""}`}
						>
							<p className={styles.stepHeading}>
								Step 2: Upload selected file
							</p>
							<button
								ref={uploadButtonRef}
								type="button"
								className={`${styles.uploadButton} ${styles.uploadButtonCentered}`}
								onClick={handleUploadClick}
								disabled={stepSlotsPending || uploadPhase !== "idle"}
								tabIndex={stepSlotsPending ? -1 : undefined}
							>
								Upload
							</button>
						</div>
						<p className={styles.stepFootnote}>
							{selectedFile
								? "Send your clip to Meowlin for processing."
								: "\u00a0"}
						</p>
					</div>
					<div
						className={`${styles.stepResetColumn} ${stepSlotsPending ? styles.stepSlotPending : ""}`}
						aria-hidden={stepSlotsPending}
					>
						<button
							type="button"
							className={styles.uploadButton}
							onClick={handleResetClick}
							disabled={stepSlotsPending}
							tabIndex={stepSlotsPending ? -1 : undefined}
						>
							Reset
						</button>
					</div>
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
				<div ref={revealLayerRef} className={styles.revealLayer}>
					<WhatsThatCatBreed
						resultsHostRef={resultsHostRef}
						revealed={revealComplete}
						identifiedBreed={
							revealComplete
								? (getClipResultRequest?.identifiedBreed ?? null)
								: null
						}
						confidenceScore={
							revealComplete
								? (getClipResultRequest?.confidenceScore ?? null)
								: null
						}
					/>
				</div>
			)}
		</div>
	)
}
