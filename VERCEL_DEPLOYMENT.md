# Deploying MahmudGPT to Vercel

## Step 1: Connect GitHub Repository

1. Push your code to GitHub (Lovable does this automatically)
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repository

## Step 2: Configure Build Settings

Vercel should auto-detect these from `vercel.json`, but verify:

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

## Step 3: Add Environment Variables

In **Vercel → Project → Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://dnjzkewlixghwwculbsf.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanprZXdsaXhnaHd3Y3VsYnNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODA1MjIsImV4cCI6MjA4NjA1NjUyMn0.md6D5ld8vwQkT2sdi1gfqQ6RO0-mdK21v8dO16QUsik` |
| `VITE_SUPABASE_PROJECT_ID` | `dnjzkewlixghwwculbsf` |

> ⚠️ These are **publishable** keys (safe for frontend). Private keys stay in your backend secrets.

## Step 4: Configure Google OAuth Redirect

For Google Sign-In to work on your Vercel domain:

1. Open your Lovable project → **Cloud** → **Users** → **Authentication Settings**
2. Under **Redirect URLs**, add your Vercel domain:
   - `https://your-project.vercel.app`
   - `https://your-custom-domain.com` (if applicable)
3. The app automatically detects the environment and uses the correct OAuth flow

## Step 5: Deploy

Click **Deploy** in Vercel. After deployment:
- ✅ UI loads correctly
- ✅ Google OAuth works (uses direct Supabase OAuth on Vercel)
- ✅ AI chat works (edge functions run on Supabase, accessible from any origin)
- ✅ Image generation works
- ✅ ElevenLabs TTS works
- ✅ SPA routing works (vercel.json handles rewrites)

## How It Works

| Feature | Lovable Environment | Vercel Environment |
|---|---|---|
| Google OAuth | `lovable.auth.signInWithOAuth()` | `supabase.auth.signInWithOAuth()` |
| AI Chat | Edge function via Supabase URL | Same edge function via Supabase URL |
| Image Gen | Edge function via Supabase URL | Same edge function via Supabase URL |
| TTS | Edge function via Supabase URL | Same edge function via Supabase URL |
| CORS | `Access-Control-Allow-Origin: *` | Same — works from any origin |

## Troubleshooting

- **Blank page after deploy?** Check env vars are set and redeploy
- **OAuth redirect error?** Add your Vercel domain to redirect URLs
- **API calls failing?** Verify `VITE_SUPABASE_URL` is correct in Vercel env vars
- **404 on page refresh?** `vercel.json` rewrites should handle this automatically
