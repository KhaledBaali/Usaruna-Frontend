# Usaruna — أسرنا

An e-commerce marketplace connecting customers with family home-based businesses. Supports both Arabic and English, with AI-powered features for sellers.

## Features

- **Customer side** — browse products, manage cart & wishlist, checkout, order tracking
- **Seller side** — seller dashboard for managing products, orders, and AI-assisted tools
- **Family registration** — onboarding flow for home-based producers with location picker
- **AI tools** — smart reply to customer reviews, product description enhancement, review summarization (powered by Hugging Face / Qwen2.5)
- **Bilingual** — full Arabic / English UI with RTL support
- **Authentication** — login, register, forgot password, and reset password flows via Supabase Auth

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19, React Router v7, Tailwind CSS |
| Build | Vite |
| Maps | React Leaflet |
| Database & Auth | Supabase |
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
