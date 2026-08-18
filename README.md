# SmartSociety — Clifton Heights Society Management

React front end for a role-based housing society management system. Built with Vite, React, and Tailwind CSS v4.

## Getting started

```bash
npm install
npm run dev
```

The app runs on `http://localhost:5173` by default.

## Pages

The homepage (`/`) is a public landing page showcasing the platform's features and role-based access. From there, users click "Sign in" to reach the login page and enter their dashboard.

An `/about` page explains the project background, the six modules, and the tech stack — reads like a real product site, not a single-page app.

The logo is a custom SVG (`src/components/Logo.jsx`) — a stylized building block with a gate/keyhole cutout. Not a generic icon.

### Demo accounts

| Role            | Username        | Password      |
|-----------------|-----------------|---------------|
| Administrator   | `admin`         | `admin123`    |
| Resident        | `ahmed.raza`    | `resident123` |
| Security Guard  | `gate.usman`    | `guard123`    |

You can also go to `/sitemap` to see every route in the app.

## QR Code Visitor Pass System

The app includes a complete QR code visitor gate pass system. Here's how it works end-to-end:

### Overview

Residents generate digital visitor passes from their dashboard. Each pass gets a **unique 6-digit code** and a **scannable QR code**. When the visitor arrives at the gate, the security guard either types the code or scans the QR code into the Pass Verification terminal. The system instantly checks if the pass is valid, logs the entry, and marks the pass as used.

### Step-by-step flow

1. **Resident creates a pass** — On the "Visitor Passes" page, a resident fills in the visitor's name, phone, vehicle number, purpose (Guest/Delivery/Cab/Service Staff), and a valid time window (from/to).

2. **System generates the pass** — The app creates a unique 6-digit numeric code (e.g. `482916`) and renders a QR code (using the `qrcode.react` library) that encodes that same code. The pass appears as a card on the resident's screen showing the code, QR, validity window, and status.

3. **Resident shares the pass** — The resident shares the 6-digit code or QR code with their visitor (via WhatsApp, SMS, screenshot, etc.).

4. **Guard verifies at the gate** — When the visitor arrives, the guard opens the "Pass Verification" page and either:
   - Types the 6-digit code into the input field, or
   - Scans the QR code (if the guard's device has a camera scanner)

5. **System validates the pass** — The backend (`verifyPassCode()` in `gateService.js`) checks:
   - Does a pass with this code exist?
   - Is it already used? (rejects)
   - Has it expired? (rejects if past the valid-to time)
   - If all checks pass → logs a gate entry, marks the pass as "Used", and shows a success screen.

6. **Entry is logged** — A gate log entry is automatically created with the visitor's name, phone, vehicle, flat, check-in time, and the linked pass ID. The guard sees this in the Gate Dashboard.

7. **Overstay detection** — If a visitor stays longer than expected, the guard can flag them for overstay from the "Overstay Management" page. This flags the entry so admin can see it in the security logs.

8. **Check-out** — When the visitor leaves, the guard checks them out, recording the check-out time. The gate log entry is updated accordingly.

### Where the code lives

| File | What it does |
|------|-------------|
| `src/services/visitorService.js` | Creates passes, generates 6-digit codes, checks expiry |
| `src/services/gateService.js` | `verifyPassCode()` — validates code at gate, logs entry, marks pass used |
| `src/pages/resident/VisitorPasses.jsx` | Resident UI — create pass, view QR code, see pass history |
| `src/pages/guard/PassVerification.jsx` | Guard UI — type/scan code, see verify result, recent verifications |
| `src/pages/guard/VisitorLog.jsx` | Guard UI — log walk-ins (no pass needed), check out visitors |
| `src/pages/guard/Overstay.jsx` | Guard UI — flag and manage overstay alerts |
| `src/utils/id.js` | `gatePassCode()` — generates the random 6-digit numeric code |
| `src/data/seed.js` | Seed visitor passes for development |

### Technical details

- **QR library**: `qrcode.react` (renders an SVG QR code that encodes the 6-digit pass code)
- **Code format**: 6-digit numeric (e.g. `482916`) — designed to be easy for a guard to type on a shared tablet
- **Pass states**: Active → Used (after verification) or Expired (after valid-to time passes)
- **Storage**: Currently localStorage via `src/data/db.js` — swap for real API calls when the backend is ready (see `docs/API_CONTRACT.md`)

## Architecture

```
src/
├── components/
│   ├── layout/        # App shell, sidebar, topbar, route guards
│   └── ui/            # Reusable UI kit (Button, Card, Badge, Modal, etc.)
├── context/
│   └── AuthContext.jsx   # Login/logout, session persistence
├── data/
│   ├── db.js             # localStorage-backed mock store + pub/sub
│   └── seed.js           # Seed data for development
├── hooks/
│   └── useCollection.js  # Reactive collection hook
├── services/            # Business logic — swap these for API calls later
│   ├── billingService.js
│   ├── visitorService.js
│   ├── gateService.js
│   ├── complaintService.js
│   ├── amenityService.js
│   ├── noticeService.js
│   ├── residentService.js
│   └── staffService.js
├── utils/
│   ├── format.js        # PKR formatting, date helpers
│   └── id.js            # Lightweight ID + pass code generator
└── pages/
    ├── Home.jsx              # Public landing page
    ├── Login.jsx            # Authentication
    ├── Sitemap.jsx          # Route directory
    ├── resident/           # 8 resident-facing screens
    ├── guard/              # 4 guard-facing screens
    └── admin/              # 6 admin-facing screens
```

## Connecting to the real backend

The service files in `src/services/` currently read and write through `src/data/db.js`,
which uses `localStorage` as a stand-in for the API. When the backend is ready, replace
the function bodies in each service file with `fetch`/`axios` calls — the component layer
doesn't change.

See `docs/API_CONTRACT.md` for the expected endpoint shapes.
