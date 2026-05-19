# Meowlin Frontend

This folder contains the Meowlin React frontend built with Next.js.

## Location

Frontend root: `src/react`

## Run The Dev Server

From the React folder:

```bash
cd src/react
npm install
npm run dev
```

Then open `http://localhost:3000`.

You can also start it from the repository root:

```bash
npm --prefix src/react install
npm --prefix src/react run dev
```

## Useful Commands

Run these from `src/react`:

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
