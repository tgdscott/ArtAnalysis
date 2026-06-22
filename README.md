<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Projective Art Analyst

A Vite/React prototype for generating ambiguous coloring pages, uploading completed artwork, running local OpenCV measurements, and asking Gemini to synthesize the visual evidence into a short projective-art snapshot.

View the original AI Studio app: https://ai.studio/apps/drive/1775u5eZdKbWrtbNZp3tffjmdUe8O61nY

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Optional: set `GEMINI_API_KEY` in `.env.local` to your Gemini API key.
3. Run the app:
   `npm run dev`

The browser login screen also accepts an optional Gemini API key. That key is stored only in the current browser's local storage and is useful for GitHub Pages demos where there is no private backend.

## Deploy to GitHub Pages

This repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that builds the Vite app and uploads `dist` to GitHub Pages whenever `main` changes.

For the public project URL `https://tgdscott.github.io/ArtAnalysis/`, the production Vite base path is configured as `/ArtAnalysis/`.

### One-time GitHub setting

In the repository, go to **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**. After that, pushes to `main` should deploy automatically.

## API key note

GitHub Pages is static hosting. It cannot hide server-side secrets. Do not put a long-lived personal Gemini API key into a public static build unless you understand that it can be extracted from the deployed JavaScript. For demos, either have the tester paste their own key into the login screen or add a small backend/proxy later.