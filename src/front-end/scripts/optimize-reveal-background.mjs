/**
 * Encode the reveal burst template video for the web.
 *
 * Usage (from src/front-end):
 *   npm run optimize-reveal-background -- "C:\path\to\cat_breed_id_bg_looped.mov"
 *
 * Outputs:
 *   public/videos/reveal-background.webm  (VP9, primary)
 *   public/videos/reveal-background.mp4   (H.264, Safari)
 *   public/videos/reveal-background-poster.webp
 *   images/reveal_background.webp         (static fallback / reduced motion)
 */
import { spawn } from "node:child_process"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const defaultInput = path.join(
	process.env.USERPROFILE ?? "",
	"Videos",
	"cat_breed_id_bg_looped.mov",
)
const input = path.resolve(process.argv[2] ?? defaultInput)
const videosDir = path.join(root, "public", "videos")
const imagesDir = path.join(root, "images")

const maxWidth = 960
const scale = `scale=${maxWidth}:-2:flags=lanczos`
const webmPath = path.join(videosDir, "reveal-background.webm")
const mp4Path = path.join(videosDir, "reveal-background.mp4")
const posterPng = path.join(videosDir, "reveal-background-poster.png")
const posterWebp = path.join(videosDir, "reveal-background-poster.webp")
const fallbackWebp = path.join(imagesDir, "reveal_background.webp")

function run(cmd, args) {
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, args, { stdio: "inherit", shell: process.platform === "win32" })
		child.on("error", reject)
		child.on("close", (code) =>
			code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`)),
		)
	})
}

await mkdir(videosDir, { recursive: true })

console.log(`Input: ${input}`)

await run("ffmpeg", [
	"-y",
	"-i",
	input,
	"-an",
	"-vf",
	scale,
	"-c:v",
	"libvpx-vp9",
	"-crf",
	"34",
	"-b:v",
	"0",
	"-row-mt",
	"1",
	"-cpu-used",
	"2",
	"-pix_fmt",
	"yuv420p",
	"-deadline",
	"good",
	webmPath,
])

await run("ffmpeg", [
	"-y",
	"-i",
	input,
	"-an",
	"-vf",
	scale,
	"-c:v",
	"libx264",
	"-crf",
	"26",
	"-preset",
	"slow",
	"-movflags",
	"+faststart",
	"-pix_fmt",
	"yuv420p",
	mp4Path,
])

await run("ffmpeg", [
	"-y",
	"-i",
	input,
	"-ss",
	"00:00:00",
	"-vframes",
	"1",
	"-vf",
	scale,
	"-update",
	"1",
	posterPng,
])

const posterBuffer = await sharp(posterPng).webp({ quality: 85 }).toBuffer()
await sharp(posterBuffer).toFile(posterWebp)
await sharp(posterBuffer).toFile(fallbackWebp)

const { unlink } = await import("node:fs/promises")
await unlink(posterPng).catch(() => {})

console.log("Wrote:")
console.log(`  ${path.relative(root, webmPath)}`)
console.log(`  ${path.relative(root, mp4Path)}`)
console.log(`  ${path.relative(root, posterWebp)}`)
console.log(`  ${path.relative(root, fallbackWebp)}`)
