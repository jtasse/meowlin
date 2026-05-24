"use client"

import { getDisplayBreedName } from "@/lib/breedImages"
import styles from "./page.module.css"

type BreedRevealPanelProps = {
	revealed: boolean
	identifiedBreed: string | null
	confidenceScore?: number | null
}

export function BreedRevealPanel({
	revealed,
	identifiedBreed,
	confidenceScore = null,
}: BreedRevealPanelProps) {
	const showBreedName = revealed && identifiedBreed != null
	const showNoBreed = revealed && identifiedBreed == null
	const displayBreed = identifiedBreed
		? getDisplayBreedName(identifiedBreed)
		: null
	const showConfidence = showBreedName && confidenceScore != null

	if (showBreedName) {
		return (
			<div className={styles.breedRevealStack}>
				<div className={styles.breedRevealCard}>
					<p className={styles.resultSectionLabel}>Breed ID</p>
					<p className={styles.breedRevealName}>{displayBreed}</p>
				</div>
				{showConfidence && (
					<div className={styles.breedRevealCard}>
						<p className={styles.resultSectionLabel}>Confidence</p>
						<p className={styles.breedRevealName}>
							{Math.round(confidenceScore * 100)}%
						</p>
					</div>
				)}
			</div>
		)
	}

	if (showNoBreed) {
		return (
			<div className={styles.breedRevealStack}>
				<div className={styles.breedRevealCard}>
					<p className={styles.breedRevealName}>No breed identified</p>
				</div>
				<span className={styles.noBreedEmoji} aria-hidden="true">
					😿
				</span>
			</div>
		)
	}

	return (
		<>
			<span className={styles.questionMark} aria-hidden="true">
				?
			</span>
			<span className={styles.guessLabel}>cat breed</span>
		</>
	)
}
