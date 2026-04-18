# Streak — Landing Page

Marketing landing page for **Streak**, a habit-tracking app. Built with Next.js 14 (App Router), TypeScript, and Tailwind CSS.

## Stack

- **Next.js 14** (App Router)
- **TypeScript** (strict)
- **Tailwind CSS** with a custom theme (navy `#0F1B3C`, orange `#FF6B35`, cream `#FDFAF5`)
- **next/font** — Inter (body) + Fraunces (display)
- **lucide-react** — icons

## Getting started

Requires Node.js 18.17+.

```bash
cd streak-landing
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | What it does                          |
| --------------- | ------------------------------------- |
| `npm run dev`   | Start the dev server on port 3000     |
| `npm run build` | Production build                      |
| `npm run start` | Serve the production build            |
| `npm run lint`  | Run Next.js lint                      |

## Project layout

```
streak-landing/
├── app/
│   ├── globals.css       # Tailwind directives + base styles
│   ├── layout.tsx        # Root layout, fonts, metadata
│   └── page.tsx          # Composes the landing sections
├── components/
│   ├── Nav.tsx           # Sticky top nav
│   ├── Hero.tsx          # Headline, CTAs, phone mockup
│   ├── PhoneMockup.tsx   # Pure CSS/SVG phone with habit list
│   ├── Features.tsx      # Three-card feature grid
│   ├── Pricing.tsx       # Free vs Pro tiers
│   ├── Footer.tsx        # Link columns + copyright
│   └── Wordmark.tsx      # Logo wordmark, reused in nav/footer
├── tailwind.config.ts
├── next.config.js
├── postcss.config.js
└── tsconfig.json
```

## Design tokens

Set in `tailwind.config.ts` and used throughout the components:

- Colors: `navy`, `orange`, `orange-dark`, `cream`
- Radius: `rounded-card` (12px) on cards and buttons
- Shadows: `shadow-soft`, `shadow-soft-lg`, `shadow-glow` (orange)
- Fonts: `font-sans` (Inter), `font-display` (Fraunces)
