# Deploy Punch's Parent Evaluator to Vercel

## One-time setup

1. **Import the GitHub repo**
   - Go to [vercel.com/new](https://vercel.com/new).
   - Import `Samarth099/punch-parent-evaluator` (or your fork).
   - Leave **Build Command** and **Output Directory** blank.
   - Click **Deploy**.

2. **Add the OpenRouter API key**
   - In the Vercel project: **Settings → Environment Variables**.
   - Add:
     - **Key:** `OPENROUTER_API_KEY`
     - **Value:** your key from [openrouter.ai/keys](https://openrouter.ai/keys)
     - **Environments:** Production (and Preview if you like)
   - Save.

3. **Redeploy**
   - **Deployments** → open the ⋮ on the latest deployment → **Redeploy**.
   - This applies the new env. After that, the app will use your key for evaluation.

## Test

Open the deployed URL (e.g. `https://punch-parent-evaluator-xxx.vercel.app`):

1. Click **Start Camera** and allow access.
2. Click **Snap for Punch!**.
3. You should see “Punch is evaluating you…” then the score and verdict.

If you see “Evaluation service is not configured yet”, the env var is missing or you need to redeploy after adding it.
