import { describe, expect, it } from "vitest"

import {
	breedToSlug,
	getBreedImage,
	getBreedImageDisplay,
	getDisplayBreedName,
	resolveBreedSlug,
} from "./breedImages"

describe("breedToSlug", () => {
	it("normalizes breed labels to slugs", () => {
		expect(breedToSlug("Maine Coon")).toBe("maine_coon")
		expect(breedToSlug("  Siamese  ")).toBe("siamese")
	})
})

describe("resolveBreedSlug", () => {
	it("maps legacy domestic_shorthair alias", () => {
		expect(resolveBreedSlug("Domestic Shorthair")).toBe("american_shorthair")
	})
})

describe("getDisplayBreedName", () => {
	it("uses friendly label for American Shorthair", () => {
		expect(getDisplayBreedName("american_shorthair")).toBe("American Shorthair")
	})

	it("returns original label for other breeds", () => {
		expect(getDisplayBreedName("Siamese")).toBe("Siamese")
	})
})

describe("getBreedImage", () => {
	it("returns an image for known breeds", () => {
		expect(getBreedImage("Siamese")).toBeTruthy()
		expect(getBreedImage("Maine Coon")).toBeTruthy()
	})

	it("returns null for unknown breeds", () => {
		expect(getBreedImage("Persian")).toBeNull()
	})
})

describe("getBreedImageDisplay", () => {
	it("applies per-breed scale tweaks", () => {
		expect(getBreedImageDisplay("American Shorthair")).toEqual({
			scale: 1.34,
			offsetX: "0",
		})
	})

	it("defaults scale and offset for other breeds", () => {
		expect(getBreedImageDisplay("Siamese")).toEqual({
			scale: 1,
			offsetX: "0",
		})
	})
})
