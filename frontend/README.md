# Averlen Frontend

React + TypeScript frontend for Averlen's hospitality revenue intelligence platform.

## Application areas

- Revenue overview dashboard
- Properties
- Booking data imports
- Analytics
- Pricing recommendations
- AI insights
- Notifications
- Team and workspace access
- Account settings
- Read-only demo workspace

## Development

Install dependencies:

```bash
npm install
```

Start Vite:

```bash
npm run dev
```

The local development server runs at `http://localhost:5173` by default.

## Environment

Copy `.env.example` when a direct API base URL is required:

```env
VITE_API_BASE_URL=http://localhost:8000
```

For production, set `VITE_API_BASE_URL` to the deployed Averlen API origin.

Do not place backend secrets, database credentials, Redis credentials, Cloudinary API secrets, or OpenRouter keys in frontend environment variables.

## Checks

```bash
npm run lint
npm run build
```

The production build uses route-level code splitting for major application pages.

## Production

The repository root `render.yaml` configures the frontend as a Render static site and includes the SPA rewrite required for React Router routes.
