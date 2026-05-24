"use client"

import Image from "next/image"
import { useSyncExternalStore } from "react"

import revealBackground from "@/images/reveal_background.webp"
import { withBasePath } from "@/lib/config"
import styles from "./page.module.css"

const REVEAL_VIDEO_WEBM = withBasePath("/videos/reveal-background.webm")
const REVEAL_VIDEO_MP4 = withBasePath("/videos/reveal-background.mp4")

function subscribeReducedMotion(onStoreChange: () => void) {
	const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
	mq.addEventListener("change", onStoreChange)
	return () => mq.removeEventListener("change", onStoreChange)
}

function getReducedMotion() {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function getServerReducedMotion() {
	return false
}

export function RevealBackground() {
	const reduceMotion = useSyncExternalStore(
		subscribeReducedMotion,
		getReducedMotion,
		getServerReducedMotion,
	)

	return (
		<div className={styles.revealBurstClip} aria-hidden="true">
			{reduceMotion ? (
				<Image
					src={revealBackground}
					alt=""
					className={styles.revealBackdropImg}
					sizes="(max-width: 1060px) 52vw, 520px"
					priority
				/>
			) : (
				<video
					className={styles.revealBackdropImg}
					autoPlay
					loop
					muted
					playsInline
					preload="metadata"
					poster={revealBackground.src}
					disablePictureInPicture
					disableRemotePlayback
				>
					<source src={REVEAL_VIDEO_WEBM} type="video/webm" />
					<source src={REVEAL_VIDEO_MP4} type="video/mp4" />
				</video>
			)}
		</div>
	)
}
