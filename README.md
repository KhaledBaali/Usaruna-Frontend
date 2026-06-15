# Usaruna — أسرنا

An e-commerce marketplace connecting customers with family home-based businesses. Supports both Arabic and English, with AI-powered features for sellers.

## Features

- **Customer side** — browse products, manage cart & wishlist, checkout, order tracking
- **Seller side** — seller dashboard for managing products, orders, and AI-assisted tools
- **Family registration** — onboarding flow for home-based producers with location picker
- **AI tools** — smart reply to customer reviews, product description enhancement, review summarization (powered by Hugging Face / Qwen2.5)
- **Bilingual** — full Arabic / English UI with RTL support
- **Authentication** — login, register, forgot password, and reset password flows via Supabase Auth

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend                     │
│         (Vite · Tailwind · React Leaflet)           │
└───────────────┬─────────────────┬───────────────────┘
                │                 │
                ▼                 ▼
  ┌─────────────────────┐  ┌─────────────────────────┐
  │  Node.js / Express  │  │   Python / FastAPI      │
  │  (Usaruna Backend)  │  │   (AI Service)          │
  │                     │  │                         │
  │  · /verify-producer │  │  · /enhance             │
  │  · /checkout        │  │  · /summarize           │
  └────────┬────────────┘  │  · /smart-reply         │
           │               └──────────┬──────────────┘
           ▼                          │
  ┌─────────────────────┐             │ Hugging Face API
  │      Supabase       │             │ (Qwen2.5-7B)
  │  (DB + Auth +       │◄────────────┘
  │   Storage)          │
  └─────────────────────┘
```

## AI Tools

The AI service (`ai.py`) uses [Qwen2.5-7B-Instruct](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct) via the Hugging Face API and exposes three endpoints called from `aiApi.js` in the frontend:

| Endpoint | Function | Used in |
|---|---|---|
| `POST /enhance` | Rewrites a raw product description into professional marketing copy | Seller product form |
| `POST /summarize` | Generates a one-sentence consensus summary from multiple customer reviews | Product details page |
| `POST /smart-reply` | Drafts a contextual reply to a customer review using product info | Seller dashboard |

All endpoints respond in the same language as the input (Arabic or English).

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19, React Router v7, Tailwind CSS |
| Build | Vite |
| Maps | React Leaflet |
| Database & Auth | Supabase |
| AI | Hugging Face API · Qwen2.5-7B · FastAPI |
| Testing | Vitest (unit), Playwright (e2e) |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- The [Usaruna Backend](https://github.com/KhaledBaali/Usaruna-Backend) running locally or deployed

### Installation

```bash
git clone https://github.com/KhaledBaali/Usaruna-Frontend.git
cd Usaruna-Frontend
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=http://localhost:5000
VITE_AI_URL=http://localhost:8000
```

### Run

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run end-to-end tests (Playwright) |

## Deployment

The frontend is a standard Vite SPA and can be deployed to any static hosting platform.

**Vercel (recommended)**
1. Import the repository at [vercel.com](https://vercel.com)
2. Set the environment variables from `.env.local` in the Vercel dashboard
3. Vercel auto-detects Vite — no extra configuration needed

**Manual build**
```bash
npm run build   # outputs to dist/
```
Upload the `dist/` folder to any static host (Netlify, GitHub Pages, etc.).

> Make sure `VITE_BACKEND_URL` and `VITE_AI_URL` point to your deployed backend URLs before building.

## Project Structure

```
src/
├── contexts/          # React contexts (Auth, Cart, Wishlist, Language)
├── lib/               # Supabase client and utilities
├── translations/      # ar.js / en.js language strings
├── App.jsx            # Root component and routes
├── HomePage.jsx
├── ProductDetailsPage.jsx
├── CartPage.jsx
├── CheckoutPage.jsx
├── CustomerDashboard.jsx
├── SellerDashboard.jsx
├── FamilyRegisterPage.jsx
├── LoginPage.jsx
├── UserRegisterPage.jsx
├── LocationPicker.jsx
├── aiApi.js           # AI service calls (enhance, summarize, smart-reply)
└── api.js             # Supabase data helpers
```

## Related

- [Usaruna Backend](https://github.com/KhaledBaali/Usaruna-Backend) — Node.js/Express API + Python/FastAPI AI service

## License

MIT © [Khaled Baali](https://github.com/KhaledBaali)
