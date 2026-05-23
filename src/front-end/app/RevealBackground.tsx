"use client"

import Image from "next/image"

import revealBackground from "@/images/reveal_background.webp"
import styles from "./page.module.css"

export function RevealBackground() {
	return (
		<div className={styles.revealBurstClip} aria-hidden="true">
			<Image
				src={revealBackground}
				alt=""
				className={styles.revealBackdropImg}
				sizes="(max-width: 1060px) 52vw, 520px"
				priority
			/>
		</div>
	)
}
