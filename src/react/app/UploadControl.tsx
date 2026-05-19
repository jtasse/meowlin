"use client"

import { useRef, useState } from "react"

import styles from "./page.module.css"

type UploadControlProps = {
	onFileSelected?: (file: File) => void
}

export function UploadControl({ onFileSelected }: UploadControlProps) {
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [isUploading, setIsUploading] = useState<boolean>(false)
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

	function handleUploadClick() {
		if (selectedFile) {
			setIsUploading(true)
			// TODO: Implement upload logic
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
						>
							Upload selected file
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
			<p className={styles.uploadStatus}>{isUploading ? "Uploading..." : ""}</p>
		</div>
	)
}
