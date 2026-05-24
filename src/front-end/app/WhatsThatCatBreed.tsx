"use client"

import Image from "next/image"

import {
	getBreedImage,
	getBreedImageDisplay,
	getDisplayBreedName,
	UNKNOWN_CAT_IMAGE,
} from "@/lib/breedImages"
import styles from "./page.module.css"

type WhatsThatCatBreedProps = {
	revealed: boolean
	identifiedBreed: string | null
	confidenceScore?: number | null
}

export function WhatsThatCatBreed({
	revealed,
	identifiedBreed,
	confidenceScore = null,
}: WhatsThatCatBreedProps) {
	const breedImage =
		revealed && identifiedBreed
			? getBreedImage(identifiedBreed)
			: null
	const catImage = breedImage ?? UNKNOWN_CAT_IMAGE
	const showBreedName = revealed && identifiedBreed != null
	const showNoBreed = revealed && identifiedBreed == null
	const displayBreed = identifiedBreed
		? getDisplayBreedName(identifiedBreed)
		: null
	const showConfidence =
		showBreedName && confidenceScore != null
	const catImageDisplay =
		revealed && identifiedBreed
			? getBreedImageDisplay(identifiedBreed)
			: { scale: 1, offsetX: "0" }
	const hasCatImageDisplayTweak =
		catImageDisplay.scale !== 1 || catImageDisplay.offsetX !== "0"

	return (
		<div className={styles.revealArena} aria-live="polite">
			<div className={styles.revealCat}>
				<div className={styles.catStage}>
					<div
						className={styles.catImageWrap}
						style={
							hasCatImageDisplayTweak
								? ({
										"--cat-image-scale": catImageDisplay.scale,
										"--cat-image-offset-x":
											catImageDisplay.offsetX,
									} as React.CSSProperties)
								: undefined
						}
					>
						<Image
							src={catImage}
							alt={
								showBreedName && displayBreed
									? `${displayBreed} cat`
									: "Mystery cat silhouette"
							}
							className={styles.catImage}
							priority
						/>
					</div>
				</div>
			</div>

			<div className={styles.revealGuessColumn}>
				<div className={styles.revealGuess}>
				{showBreedName ? (
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
				) : showNoBreed ? (
					<div className={styles.breedRevealStack}>
						<div className={styles.breedRevealCard}>
							<p className={styles.breedRevealName}>No breed identified</p>
						</div>
						<span className={styles.noBreedEmoji} aria-hidden="true">
							😿
						</span>
					</div>
				) : (
					<>
						<span className={styles.questionMark} aria-hidden="true">
							?
						</span>
						<span className={styles.guessLabel}>cat breed</span>
					</>
				)}
				</div>
			</div>
		</div>
	)
}
