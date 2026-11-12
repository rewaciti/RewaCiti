# RewaCiti

RewaCiti connects buyers, renters, and students in Ile-Ife with trusted real estate listings, housing guides, and local property services.

The app is a single-page React frontend backed by two APIs:

- **SabiFlow Real Estate public API** (`/real-estate/public/v1`) for listings, bookings, payments, and public forms.
- **SabiFlow customer API** (`/customers/*`) for sign-up, sign-in, email verification, password reset, and profile management.

## Features

- Browse and search property listings, filtered by location, type, price, and sharing type.
- Property detail pages with photo gallery, amenities, agent info, map, and related listings.
- Save/unsave (wishlist) properties for signed-in customers.
- Book in-person or virtual inspections, with slot availability and reschedule/cancel.
- Purchase listings and pay invoices through Paystack.
- Request a property, apply for a co-rent arrangement, or list a property.
- Agent inquiries, contact forms, and agent reports.
- Customer accounts: profile, addresses, bookings, inquiries, requests, and deals.
- Blog, comments, and FAQ sections.
- Light/dark theme, responsive layouts, and lazy-loaded images.

## Tech Stack

| Area | Tools |
| --- | --- |
| Framework | React 18 |
| Language | TypeScript 5.9 |
| Build tool | Vite (`rolldown-vite`) |
| Routing | React Router 7 |
| State | Zustand |
| Styling | Tailwind CSS v4 |
| HTTP | Axios |
| Maps | Leaflet + React Leaflet |
| Payments | Paystack (`@paystack/inline-js`, `react-paystack`) |
| UI | Radix UI, Lucide React, React Icons, Sonner |
| SEO | React Helmet Async |

## Getting Started

### Prerequisites

- Node.js 20+ (or a version supported by Vite 7)
- npm

### Install

```bash
npm install
```

### Configure environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Base URL of the SabiFlow API, e.g. `https://api.sabiflow.com/api`. |
| `VITE_COMPANY_ID` | Yes | RewaCiti's company id, used for customer sign-in and registration. |
| `VITE_SABIFLOW_PUBLIC_KEY` | Yes | Public (`pk_…`) key for the Real Estate API, restricted to the site's allowed addresses. Use a `pk_test_…` key to try requests without saving data. |

> These values are bundled into the browser, so never put a secret (`sk_…`) key in this file.

### Run locally

```bash
npm run dev
```

Vite starts the dev server and opens it in your browser.

### Build and preview

```bash
npm run build
npm run preview
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── app/                       # App shell, routes, global pages and styles
│   ├── App.tsx                # Router, theme handling, toaster
│   ├── main.tsx               # React entry point
│   ├── pages/                 # Standalone pages (Home, About, Contact, Terms, …)
│   └── styles/
│
├── features/                  # Domain modules
│   ├── auth/                  # Login, sign-up, verification, profile, account
│   ├── blog/                  # Blog list and post detail
│   ├── comments/              # Comment section and all-comments page
│   ├── faq/                   # FAQ section and all-FAQs page
│   ├── inspections/           # Visit slots and inspection booking
│   ├── map/                   # Map-related state
│   └── properties/            # Listings, details, requests, payments, filters
│
├── shared/                    # Reusable across features
│   ├── components/            # Layout (Navbar, Footer) and UI (Skeleton, LazyImage)
│   ├── hooks/                 # useRequestKey, useScrollToHash
│   ├── lib/                   # Axios clients, payments, utils
│   └── store/                 # Theme store
│
└── types/                     # Shared TypeScript types (API contracts)
```

### Conventions

- **Feature-first**: each domain owns its `components/`, `pages/`, `services/`, `store/`, and optional `index.ts` barrel.
- **Service layer**: all HTTP calls live in `features/*/services/*.ts`; components and stores do not call Axios directly.
- **State**: Zustand stores hold UI and session state (auth, theme, wishlist, blog, comments, FAQ).
- **Shared code**: only genuinely cross-feature code belongs in `shared/`. Shared components should have no domain logic.
- **Types**: API response shapes live in `src/types/` and are imported by services.

## API Layer

### Real Estate API client

`src/shared/lib/realEstateApi.ts` creates the Axios instance used by every real estate feature.

- Base URL: `${VITE_API_URL}/real-estate/public/v1`
- Sends the public key as `x-api-key`.
- Attaches the customer's bearer token when signed in.
- On `401`, retries once without the token and signs the customer out if the answer is unchanged.
- Exposes helpers: `errorMessage`, `newRequestKey`, `once`, and `noteTestMode`.

### Customer API

`src/features/auth/services/authAPI.ts` handles the `/customers/*` endpoints:

- Login, register, verify email, resend OTP, forgot password, reset password.
- Profile read/update and password change.

### Domain services

| Service | Responsibility |
| --- | --- |
| `propertiesAPI` | Listings, filters, locations, types, forms, saved properties, purchase. |
| `requestsAPI` | Inquiries, contact, property requests, co-rent, agent applications/reports, ratings. |
| `visitsAPI` | Visit slots and inspection booking. |
| `accountAPI` | Customer bookings, inquiries, requests, deals, reschedule/cancel. |

## Payments

Payments are handled in `src/shared/lib/payments.ts`:

1. `POST /payments/start` returns a Paystack access code (or a redirect URL).
2. Paystack opens in a popup via `@paystack/inline-js`.
3. On success, `POST /payments/verify` confirms the payment.
4. If the popup is unavailable or fails, the customer can fall back to the invoice's payment page.

Amounts always come from SabiFlow, never from the browser.

## Routes

| Path | Page |
| --- | --- |
| `/` | Home |
| `/properties` | Property listings |
| `/properties/:slug` | Property details |
| `/request-property` | Request a property |
| `/co-rent` | Co-rent request |
| `/list-property` | List a property |
| `/property-feature-icons` | Property feature icon preview |
| `/blog` | Blog list |
| `/blog/:slug` | Blog post |
| `/AllComments` | All comments |
| `/AllFAQs` | All FAQs |
| `/About` | About |
| `/Service` | Services |
| `/Contact` | Contact |
| `/terms` | Terms |
| `/privacy-policy` | Privacy policy |
| `/auth/login` | Sign in / sign up |
| `/auth/verify-email` | Email verification |
| `/auth/forgot-password` | Forgot password |
| `/auth/reset-password` | Reset password |
| `/auth/profile` | Account dashboard |
| `/auth/profile/settings` | Profile settings |
| `/Studentarea` | Redirects to `/properties` |
| `*` | Not found |

## Deployment

The app deploys as a static site. `vercel.json` rewrites all routes to `index.html` so client-side routing works on refresh and direct links.

Any static host works as long as it serves `index.html` for unknown paths and injects the `VITE_*` variables at build time.
