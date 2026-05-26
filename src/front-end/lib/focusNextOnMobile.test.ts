import { afterEach, describe, expect, it, vi } from "vitest"

import {
	focusNextOnMobile,
	isMobileViewport,
	MOBILE_MEDIA_QUERY,
	scrollStepIntoView,
} from "./focusNextOnMobile"

function mockMatchMedia(matchesByQuery: Record<string, boolean>) {
	vi.stubGlobal(
		"matchMedia",
		vi.fn((query: string) => ({
			matches: matchesByQuery[query] ?? false,
			media: query,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	)
}

describe("isMobileViewport", () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it("returns false when viewport is wider than mobile breakpoint", () => {
		mockMatchMedia({ [MOBILE_MEDIA_QUERY]: false })
		expect(isMobileViewport()).toBe(false)
	})

	it("returns true when viewport is at or below mobile breakpoint", () => {
		mockMatchMedia({ [MOBILE_MEDIA_QUERY]: true })
		expect(isMobileViewport()).toBe(true)
	})
})

describe("scrollStepIntoView", () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it("does nothing when target is null", () => {
		mockMatchMedia({ "(prefers-reduced-motion: reduce)": false })
		expect(() => scrollStepIntoView(null)).not.toThrow()
	})

	it("scrolls on desktop and mobile viewports", () => {
		mockMatchMedia({
			[MOBILE_MEDIA_QUERY]: false,
			"(prefers-reduced-motion: reduce)": true,
		})
		const scrollTarget = {
			scrollIntoView: vi.fn(),
		} as unknown as HTMLElement

		scrollStepIntoView(scrollTarget)

		expect(scrollTarget.scrollIntoView).toHaveBeenCalledWith({
			behavior: "auto",
			block: "center",
		})
	})

	it("honors a custom block alignment", () => {
		mockMatchMedia({ "(prefers-reduced-motion: reduce)": false })
		const scrollTarget = {
			scrollIntoView: vi.fn(),
		} as unknown as HTMLElement

		scrollStepIntoView(scrollTarget, { block: "start" })

		expect(scrollTarget.scrollIntoView).toHaveBeenCalledWith({
			behavior: "smooth",
			block: "start",
		})
	})
})

describe("focusNextOnMobile", () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it("does nothing on desktop viewports", () => {
		mockMatchMedia({
			[MOBILE_MEDIA_QUERY]: false,
			"(prefers-reduced-motion: reduce)": false,
		})
		const scrollTarget = {
			scrollIntoView: vi.fn(),
		} as unknown as HTMLElement

		focusNextOnMobile(scrollTarget)

		expect(scrollTarget.scrollIntoView).not.toHaveBeenCalled()
	})

	it("scrolls the target on mobile viewports", () => {
		mockMatchMedia({
			[MOBILE_MEDIA_QUERY]: true,
			"(prefers-reduced-motion: reduce)": true,
		})
		const scrollTarget = {
			scrollIntoView: vi.fn(),
		} as unknown as HTMLElement

		focusNextOnMobile(scrollTarget)

		expect(scrollTarget.scrollIntoView).toHaveBeenCalledWith({
			behavior: "auto",
			block: "center",
		})
	})

	it("focuses an enabled control without scrolling it", () => {
		mockMatchMedia({
			[MOBILE_MEDIA_QUERY]: true,
			"(prefers-reduced-motion: reduce)": false,
		})
		const scrollTarget = {
			scrollIntoView: vi.fn(),
		} as unknown as HTMLElement
		const focusTarget = {
			disabled: false,
			focus: vi.fn(),
		} as unknown as HTMLButtonElement

		focusNextOnMobile(scrollTarget, focusTarget)

		expect(focusTarget.focus).toHaveBeenCalledWith({ preventScroll: true })
	})
})
