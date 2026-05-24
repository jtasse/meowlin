"use client"

import Image from "next/image"

import {
	getBreedImage,
	getBreedImageDisplay,
	getDisplayBreedName,
	UNKNOWN_CAT_IMAGE,
} from "@/lib/breedImages"
import { BreedRevealPanel } from "./BreedRevealPanel"
import { RevealBackground } from "./RevealBackground"
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
	const displayBreed = identifiedBreed
		? getDisplayBreedName(identifiedBreed)
		: null
	const catImageDisplay =
		revealed && identifiedBreed
			? getBreedImageDisplay(identifiedBreed)
			: { scale: 1, offsetX: "0" }
	const hasCatImageDisplayTweak =
		catImageDisplay.scale !== 1 || catImageDisplay.offsetX !== "0"

	return (
		<div className={styles.revealMediaOuter} aria-live="polite">
			<div className={styles.revealBackdropHost}>
				<RevealBackground />
				<div className={styles.revealCat}>
					<div className={styles.catStage}>
						<div
							className={styles.catImageWrap}
							style={
								hasCatImageDisplayTweak
									? ({
											"--cat-image-scale":
												catImageDisplay.scale,
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
			</div>

			<div className={styles.revealResultsHost}>
				<div className={styles.revealGuess}>
					<BreedRevealPanel
						revealed={revealed}
						identifiedBreed={identifiedBreed}
						confidenceScore={confidenceScore}
					/>
				</div>
			</div>
		</div>
	)
}
