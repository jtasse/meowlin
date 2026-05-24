import type { StaticImageData } from "next/image"

import americanShorthairImg from "@/images/american_shorthair.webp"
import maineCoonImg from "@/images/maine_coon.webp"
import siameseImg from "@/images/siamese.webp"
import unknownImg from "@/images/unknown.webp"

export const UNKNOWN_CAT_IMAGE = unknownImg

/** Maps normalized breed slug (from API label) to static image. */
const BREED_IMAGES_BY_SLUG: Record<string, StaticImageData> = {
	siamese: siameseImg,
	maine_coon: maineCoonImg,
	american_shorthair: americanShorthairImg,
}

/** Legacy API labels mapped to current slug keys. */
const BREED_SLUG_ALIASES: Record<string, string> = {
	domestic_shorthair: "american_shorthair",
}

export function breedToSlug(breed: string): string {
	return breed
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_|_$/g, "")
}

export function resolveBreedSlug(breed: string): string {
	const slug = breedToSlug(breed)
	return BREED_SLUG_ALIASES[slug] ?? slug
}

export function getDisplayBreedName(breed: string): string {
	if (resolveBreedSlug(breed) === "american_shorthair") {
		return "American Shorthair"
	}
	return breed
}

export function getBreedImage(breed: string): StaticImageData | null {
	return BREED_IMAGES_BY_SLUG[resolveBreedSlug(breed)] ?? null
}

/** Per-breed tweaks in the reveal cat stage (scale, horizontal nudge). */
const BREED_IMAGE_DISPLAY: Partial<
	Record<string, { scale?: number; offsetX?: string }>
> = {
	american_shorthair: { scale: 1.34 },
}

export function getBreedImageDisplay(breed: string): {
	scale: number
	offsetX: string
} {
	const cfg = BREED_IMAGE_DISPLAY[resolveBreedSlug(breed)] ?? {}
	return { scale: cfg.scale ?? 1, offsetX: cfg.offsetX ?? "0" }
}
