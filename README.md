# CreditSea — Loan Management System

Full-stack LMS where borrowers apply for loans through a guided portal and internal
executives manage the loan lifecycle (Sales → Sanction → Disbursement → Collection)
through a role-guarded operations dashboard.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS · Node.js · Express 5 · MongoDB · Mongoose · JWT · bcrypt

## Project structure

```
credit-sea-assignment/
├── client/                 # Next.js frontend
│   └── src/
│       ├── app/            # App Router pages: (auth)/, portal/, dashboard/
│       ├── components/     # ui/ primitives, layout/ shells & guards
│       ├── context/        # AuthContext (JWT session)
│       ├── lib/            # api client, token helpers, route map
│       ├── types/          # shared TS types (roles, user, API envelope)
│       └── proxy.ts        # edge route protection (frontend RBAC)
├── server/                 # Express API
│   └── src/
│       ├── config/         # env validation, MongoDB connection
│       ├── constants/      # roles, loan statuses & transitions, BRE rules
│       ├── controllers/    # HTTP layer (thin)
│       ├── middleware/     # authenticate (JWT), authorize (RBAC), validate (Zod), errors
│       ├── models/         # Mongoose schemas
│       ├── routes/         # Express routers, mounted under /api
│       ├── services/       # business logic
│       ├── validators/     # Zod request schemas
│       ├── scripts/        # seed script
│       └── utils/          # ApiError, JWT, response helpers
└── package.json            # root scripts to run both apps together
```

## Quick start

```bash
# 1. Install everything
npm run install:all

# 2. Configure environment
cp server/.env.example server/.env        # set MONGODB_URI and JWT_SECRET
cp client/.env.example client/.env.local  # points to http://localhost:5000/api

# 3. Run both apps (API on :5000, web on :3000)
npm run dev
```

> Full setup guide, API reference, RBAC matrix and seeded credentials will be
> documented here as the build progresses.
