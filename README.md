# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Observability

### Sentry & PostHog (frontend)

Set in your environment (Lovable Project Settings → Environment):

- `VITE_SENTRY_DSN` — browser DSN. Leave unset to disable.
- `VITE_POSTHOG_KEY` — PostHog project key. Leave unset to disable.
- `VITE_POSTHOG_HOST` — optional, defaults to `https://us.i.posthog.com`.

Edge functions read a separate `EDGE_SENTRY_DSN` runtime secret. No-op if unset.

### Health check / uptime monitoring

Public endpoint:

```
https://<project-ref>.functions.supabase.co/health
```

Returns `200 {"status":"ok",...}` when Supabase auth + DB are reachable,
`503 {"status":"degraded",...}` otherwise. Each check includes latency in ms.

To wire **Better Stack** or **Pingdom**:

1. Create a new HTTP(S) monitor pointing at the URL above.
2. Method: `GET`. Expected status: `200`. Interval: 1–3 min.
3. Optional: assert response body contains `"status":"ok"`.
4. Add an on-call escalation policy and you're done.
