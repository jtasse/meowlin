import type { Metadata } from "next"

const siteTitle = "What's that cat breed? | Meowlin"

/** At least 100 characters for LinkedIn / Open Graph description warnings. */
const siteDescription =
	"Meowlin is a React + serverless AWS demo that simulates identifying cat breeds from uploaded meow audio. Upload a short clip, watch the breed reveal, and explore a React UI backed by AWS SAM, API Gateway, Lambda, S3, SQS, and DynamoDB."

function siteOrigin(): URL {
	// CI sets NEXT_PUBLIC_PAGES_URL to the full Pages URL (already includes base path).
	const pagesUrl = process.env.NEXT_PUBLIC_PAGES_URL?.replace(/\/$/, "")
	if (pagesUrl) {
		return new URL(`${pagesUrl}/`)
	}
	const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "")
	return new URL(`http://localhost:3000${basePath}/`)
}

export function buildSiteMetadata(): Metadata {
	const metadataBase = siteOrigin()
	const ogImage = new URL("mystery-cat.jpg", metadataBase)

	return {
		title: siteTitle,
		description: siteDescription,
		metadataBase,
		openGraph: {
			type: "website",
			locale: "en_US",
			siteName: "Meowlin",
			title: siteTitle,
			description: siteDescription,
			images: [
				{
					url: ogImage,
					width: 1200,
					height: 599,
					alt: "Silhouette of a mystery cat for the Meowlin breed identification demo",
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: siteTitle,
			description: siteDescription,
			images: [ogImage],
		},
	}
}
