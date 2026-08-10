# Meowlin Frontend

This folder contains the Meowlin React frontend built with Next.js.

## Location

Frontend root: `src/front-end`

## Run The Dev Server

From the frontend folder:

```bash
cd src/front-end
npm install
npm run dev
```

Then open `http://localhost:3000`.

You can also start it from the repository root:

```bash
npm --prefix src/front-end install
npm --prefix src/front-end run dev
```

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_BASE_URL` when calling a deployed API from local dev.

## Static export

Production builds use static export (`output: "export"`). Public GitHub Pages hosting for this demo has been retired; see the root [README](../../README.md#static-export-optional).

To verify a static build locally (PowerShell):

```powershell
$env:NEXT_PUBLIC_BASE_PATH = "/meowlin"
$env:NEXT_PUBLIC_API_BASE_URL = "http://127.0.0.1:3000"
npm run build
```

Static files are written to `out/`.

## Useful Commands

Run these from `src/front-end`:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run optimize-images
npm run optimize-reveal-background -- "C:\path\to\CatBreedIdTemplate.mp4"
```

### Reveal background video

The animated burst behind the cat comes from `cat_breed_id_bg_looped.mov` (or any Resolve export). Encode it for the web with ffmpeg (installed on your PATH):

```bash
npm run optimize-reveal-background
```

Default input is `%USERPROFILE%\Videos\cat_breed_id_bg_looped.mov`, or pass a path after `--`.

This writes:

- `public/videos/reveal-background.webm` — VP9 (~5 MB), used by Chrome/Firefox/Edge
- `public/videos/reveal-background.mp4` — H.264 (~4 MB), Safari fallback
- `images/reveal_background.webp` — poster + static fallback (`prefers-reduced-motion`)

`RevealBackground` keeps the same layout/CSS; cat, breed label, and confidence still come from `WhatsThatCatBreed` on top.

Tune the animated backdrop in `app/page.module.css` on `.revealLayer`:

- `--reveal-backdrop-scale` — uniform size (`0.9` = 10% smaller)
- `--reveal-backdrop-offset-x` / `--reveal-backdrop-offset-y` — nudge the video (e.g. `4px`, `1%`)
- `--reveal-cat-anchor-x` / `--reveal-cat-anchor-y` — cat center on the burst (`36%`, `54%`, etc.)
- `--reveal-cat-stage-size` — cat image box size

## Structure

- `app/` - App Router pages, layouts, and styles
- `public/` - Static assets
- `package.json` - Frontend scripts and dependencies
- `next.config.ts` - Next.js configuration
