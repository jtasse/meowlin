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

## Useful Commands

Run these from `src/front-end`:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Structure

- `app/` - App Router pages, layouts, and styles
- `public/` - Static assets
- `package.json` - Frontend scripts and dependencies
- `next.config.ts` - Next.js configuration
