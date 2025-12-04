# Daily Success Tracker

A minimalist PWA habit tracker where you rate your day as successful (👍) or not (👎) daily. Entries are logged to a calendar view with visual indicators.

## Features

- 📅 Calendar view with color-coded success/failure days
- 🔥 Streak tracking for consecutive successful days
- 🌓 Dark/light mode toggle
- 📱 PWA - installable on mobile devices
- 🔐 User authentication with Clerk
- ⚡ Type-safe API with JStack + Hono
- 🗄️ PostgreSQL database with Drizzle ORM

## Tech Stack

- **Framework**: Next.js 16 + React 19
- **API Layer**: JStack 1.1.1 (type-safe, built on Hono)
- **Database**: Drizzle ORM + PostgreSQL (Neon recommended)
- **Auth**: Clerk 6.x
- **Data Fetching**: TanStack Query 5.x
- **UI**: Shadcn/UI + Tailwind CSS 4
- **Validation**: Zod 4.x

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (or [Neon](https://neon.tech) account)
- [Clerk](https://clerk.com) account

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Edit `.env.local` and fill in your values:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

### 3. Setup Database

Push the database schema:

```bash
npm run db:push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio

## License

MIT
