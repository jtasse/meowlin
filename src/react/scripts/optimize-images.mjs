import { readdir, rename, unlink, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const imagesDir = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
	"images",
)

const jobs = [
	{ input: "siamese.jpg", output: "siamese.webp" },
	{ input: "maine_coon.webp", output: "maine_coon.webp" },
	{ input: "american_shorthair.avif", output: "american_shorthair.webp" },
	{ input: "unknown.jpg", output: "unknown.webp" },
]

const maxWidth = 480
const staged = []

for (const { input, output } of jobs) {
	const inputPath = path.join(imagesDir, input)
	const outputPath = path.join(imagesDir, output)
	const inPlace = path.resolve(inputPath) === path.resolve(outputPath)
	const writePath = inPlace
		? path.join(imagesDir, `${output}.new`)
		: outputPath

	const optimized = await sharp(inputPath)
		.resize({ width: maxWidth, withoutEnlargement: true })
		.webp({ quality: 82 })
		.toBuffer()

	await writeFile(writePath, optimized)
	staged.push({ writePath, outputPath, inputPath, inPlace })
	console.log(`Wrote ${path.basename(writePath)}`)
}

for (const { writePath, outputPath, inputPath, inPlace } of staged) {
	if (inPlace) {
		try {
			await unlink(outputPath)
			await rename(writePath, outputPath)
		} catch {
			console.warn(
				`Could not replace ${path.basename(outputPath)}; left ${path.basename(writePath)} — close apps using the file and re-run.`,
			)
		}
	} else if (path.resolve(inputPath) !== path.resolve(outputPath)) {
		await unlink(inputPath).catch(() => {})
	}
}

const keep = new Set(jobs.map((j) => j.output))
for (const name of await readdir(imagesDir)) {
	if (!keep.has(name)) {
		await unlink(path.join(imagesDir, name))
		console.log(`Removed ${name}`)
	}
}
