# SmartSociety Enhanced Frontend

Added frontend-only features:

1. **Interactive Society Map** at `/society-map`, available to Resident, Guard, Staff, and Admin roles. Includes clickable society zones, search, filters, facility descriptions and emergency assembly point.
2. **Society Events Calendar** shown on all four dashboards, with interactive dates and upcoming sports/cultural/community events.
3. **Emergency SOS** floating action available throughout authenticated panels. Includes Medical, Fire and Security flows, society location selection and quick-call actions.

## Run
```bash
npm ci
npm run dev
```

## Build for Netlify
```bash
npm run build
```
Deploy the generated `dist` folder. `public/_redirects` is included for SPA routing.

Backend URL: `https://team-hammad.vercel.app`
