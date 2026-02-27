# Punch's Parent Evaluator 🐒🍌

A fun web app that uses your camera to snap a photo, then asks **Punch** (a baby monkey) how likely you are to be a good monkey parent — based on warmth, playfulness, trustworthiness, and general monkey vibe. No negative traits; everything is from a baby monkey’s perspective.

## How it works

1. Open the app and click **Start Camera**.
2. Allow camera access, then click **Snap for Punch!**.
3. The image is sent to our API, which calls OpenRouter’s free vision model (Qwen 2.5 VL).
4. Punch returns a score, verdict, traits, and a short quote.

The OpenRouter API key is stored only on the server (Vercel env). Users never see or enter it.

## Project structure

- `index.html` — Single-page frontend (camera, snap, results).
- `api/evaluate.js` — Vercel serverless function that proxies to OpenRouter with your key.

## Run locally

1. Install [Vercel CLI](https://vercel.com/cli): `npm i -g vercel`
2. In this directory: `vercel dev`
3. Add env: create `.env.local` with `OPENROUTER_API_KEY=sk-or-v1-...`
4. Open the URL shown (e.g. `http://localhost:3000`).

## Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and **Import** the repo:  
   `https://github.com/Samarth099/punch-parent-evaluator`
2. Leave **Build Command** and **Output Directory** empty (static site + API routes).
3. Click **Deploy**. After the first deploy:
4. Open the project → **Settings → Environment Variables**. Add:
   - **Name:** `OPENROUTER_API_KEY`
   - **Value:** your OpenRouter API key (get one at [openrouter.ai/keys](https://openrouter.ai/keys))
   - **Environment:** Production (and Preview if you want)
5. Go to **Deployments**, open the ⋮ menu on the latest deployment → **Redeploy** so the env is applied.
6. Open your project URL and test: Start Camera → Snap for Punch!

## Tech

- Static HTML/CSS/JS (no build step).
- Vercel serverless API route for OpenRouter (key kept server-side).
- Model: `qwen/qwen2.5-vl-32b-instruct:free` (vision, free tier).

Made with 🍌 for Punch.
