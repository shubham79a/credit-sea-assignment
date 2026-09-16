# CreditSea — Loan Management System

A full-stack lending platform: borrowers apply for a loan through a guided 4-step portal, and
internal executives move each loan through its lifecycle (Sales → Sanction → Disbursement →
Collection) in a role-guarded operations dashboard.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Node.js · Express 5 · MongoDB Atlas · Mongoose · JWT + bcrypt · Cloudinary (salary slips) · Vercel

**Live:** [credit-sea-lms-chi.vercel.app](https://credit-sea-lms-chi.vercel.app) · API health: [credit-sea-assignment-api.vercel.app/api/health](https://credit-sea-assignment-api.vercel.app/api/health)

**Demo video (3–5 min):** [youtube.com/watch?v=ejIRtcZGzec](https://www.youtube.com/watch?v=ejIRtcZGzec) — borrower applies (BRE fail & pass) → sanction → disbursement → payments → auto-close

---

## Login credentials (seeded)

All accounts use the password **`Password@123`**. On the login page, click a role under
*Demo accounts* to fill these in.

| Role | Email | Sees |
|---|---|---|
| Admin | `admin@creditsea.com` | every dashboard module |
| Sales | `sales@creditsea.com` | Sales (leads) only |
| Sanction | `sanction@creditsea.com` | Sanction only |
| Disbursement | `disbursement@creditsea.com` | Disbursement only |
| Collection | `collection@creditsea.com` | Collection only |
| Borrower | `borrower@creditsea.com` | Borrower portal only |

Or register a fresh borrower from the *Create an account* link.

---

## Quick start (local)

Prerequisites: Node 20+, a MongoDB URI (local or Atlas), a Cloudinary account (free tier).

```bash
# 1. Install everything (root + server + client)
npm run install:all

# 2. Configure
cp server/.env.example server/.env          # fill MONGODB_URI, JWT_SECRET, CLOUDINARY_*
cp client/.env.example client/.env.local    # NEXT_PUBLIC_API_URL=http://localhost:5000/api

# 3. Create the six role accounts
npm run seed

# 4. Run both apps (API :5000, web :3000)
npm run dev
```

Other scripts: `npm run typecheck`, `npm run lint`, `npm run build`.

> **Cloudinary note:** salary slips upload straight from the browser to Cloudinary using a
> signature issued by the API. New Cloudinary accounts block *delivery* of PDFs by default —
> enable it under *Settings → Security → Allow delivery of PDF and ZIP files*, otherwise
> viewing an uploaded PDF returns 401 (images work regardless).

> **Local DNS note:** if `mongodb+srv://` fails with `querySrv ECONNREFUSED`, your resolver
> doesn't support SRV lookups — use the non-SRV connection string from Atlas (*Connect →
> Drivers → toggle "SRV connection string" off*).

---

## Project structure

```
credit-sea-assignment/
├── client/                      Next.js frontend (Vercel root directory: client)
│   └── src/
│       ├── app/
│       │   ├── (auth)/          login, register
│       │   ├── portal/          borrower: overview, personal-details, salary-slip, loan, track
│       │   └── dashboard/       executives: overview, sales, sanction, disbursement, collection
│       ├── components/          ui/ primitives · portal/ · dashboard/ · layout/ guards & header
│       ├── context/             AuthContext (JWT session)
│       ├── hooks/               useAsyncData, useApplication, useMyLoans
│       ├── lib/                 api client, bre & loan-math mirrors, dashboard modules, format
│       ├── types/               shared TS types (roles, loan statuses, API envelope)
│       └── proxy.ts             edge route protection (frontend RBAC)
├── server/                      Express API (Vercel root directory: server)
│   ├── api/index.ts             Vercel serverless entry (wraps the Express app)
│   ├── vercel.json              rewrites everything to the function
│   └── src/
│       ├── config/              env validation (zod), cached Mongo connection, Cloudinary
│       ├── constants/           roles, loan statuses & transitions, BRE rules, upload rules
│       ├── middleware/          authenticate (JWT), authorize (RBAC), validate (zod), errors
│       ├── models/              User, Application, Loan, Payment
│       ├── routes/              /auth, /applications, /loans, /leads
│       ├── controllers/         thin HTTP layer
│       ├── services/            business logic: bre, loan-calculator, loan, payment, lead, file
│       ├── validators/          zod request schemas
│       ├── scripts/seed.ts      creates one account per role
│       └── server.ts            local long-running server
└── package.json                 root scripts (dev / seed / typecheck for both apps)
```

---

## Borrower journey

| Step | Page | What happens |
|---|---|---|
| 1 | `/register`, `/login` | JWT auth, bcrypt-hashed passwords, all other pages protected |
| 2 | `/portal/personal-details` | Full name, PAN, DOB, monthly salary, employment mode → **BRE** |
| 3 | `/portal/salary-slip` | PDF/JPG/PNG ≤ 5 MB, uploaded directly to Cloudinary, verified & linked by the API |
| 4 | `/portal/loan` | Amount ₹50K–₹5L and tenure 30–365 days via sliders, live interest panel → **Apply** |
| — | `/portal/track` | Status, figures, rejection reason, history |

Steps unlock in order (the overview page derives progress from the data, not a stored counter),
and personal details + salary slip are **locked** while a loan is in progress.

### Business Rule Engine (BRE)

Runs on the **server** (`services/bre.service.ts`) — authoritative — and is **mirrored on the
client** for instant feedback. All rules are evaluated (no short-circuit) so the applicant sees
every problem at once; any failure blocks the application with **422** and the itemised reasons.

| Rule | Reject when |
|---|---|
| Age | not between 23 and 50 (full years, month/day aware) |
| Salary | below ₹25,000 / month |
| PAN | doesn't match `^[A-Z]{5}[0-9]{4}[A-Z]$` (input is upper-cased first) |
| Employment | Unemployed |

Why both sides? The client can be bypassed, so the server must decide; but a round-trip to
learn you typed a PAN wrong is poor UX, so the client checks too.

### Loan math

Simple interest, fixed 12% p.a., computed server-side from the validated inputs (any money
fields sent by the client are ignored):

```
SI               = (P × R × T) / (365 × 100)     T = tenure in days
Total repayment  = P + SI                        rounded to paise (2 dp)
```

e.g. ₹1,00,000 for 365 days → SI ₹12,000 → total ₹1,12,000; ₹50,000 for 30 days → SI ₹493.15.

---

## Loan lifecycle & who can trigger what

```
            SANCTION exec                DISBURSEMENT exec           COLLECTION exec (auto)
APPLIED ───────────────► SANCTIONED ───────────────► DISBURSED ───────────────► CLOSED
   │
   └── SANCTION exec (with reason) ──► REJECTED        (borrower may apply again)
```

`constants/loan.ts` → `LOAN_TRANSITIONS` is the single source of truth: each action names the
required current status and the roles allowed. `loan.service.transitionLoan()` applies it with a
conditional update (`{ _id, status: from }`), so two executives can't both approve the same loan
(second one gets **409**). Every change is appended to `statusHistory { from, to, by, at, reason? }`.

A borrower can hold **one** active loan (`APPLIED | SANCTIONED | DISBURSED`) at a time.

### Collection & auto-close

- Payment = `{ utr, amount, paidAt }`; **UTR is globally unique** (Mongo unique index → 409).
- `amount` must be > 0, ≤ 2 dp, ≤ outstanding balance (400 otherwise); date can't be in the future.
- `amountPaid` is incremented atomically with a guard that it never exceeds `totalRepayment`.
- When `amountPaid == totalRepayment` the loan transitions to **CLOSED** automatically.
- Outstanding balance is a virtual: `totalRepayment − amountPaid`.

---

## Role-based access control

Roles are a string enum on the `User` document, embedded in the JWT payload.

| | Portal | Sales | Sanction | Disbursement | Collection |
|---|:---:|:---:|:---:|:---:|:---:|
| Borrower | ✅ | | | | |
| Sales | | ✅ | | | |
| Sanction | | | ✅ | | |
| Disbursement | | | | ✅ | |
| Collection | | | | | ✅ |
| Admin | | ✅ | ✅ | ✅ | ✅ |

**Backend (authoritative):**
- `authenticate` — verifies `Authorization: Bearer <jwt>` → `req.user`; **401** if missing/invalid.
- `authorize(...roles)` — **403** unless the role is listed (Admin always passes).
- Status scoping — `GET /api/loans?status=X` only returns statuses the role's module owns
  (Sanction: APPLIED/SANCTIONED/REJECTED; Disbursement: SANCTIONED/DISBURSED; Collection:
  DISBURSED/CLOSED). `transitionLoan` re-checks the role a second time inside the service.

**Frontend (UX):**
- `proxy.ts` (Next.js edge) — anonymous → `/login?next=…`; borrowers can't open `/dashboard`;
  executives can't open `/portal`; a role can't open another module's URL (→ `/dashboard`).
- `RequireRole` / `ModuleGuard` — client-side guards after hydration; nav only lists allowed modules.

---

## REST API

Base URL `/api`. Every response is `{ success, message?, data }` or
`{ success: false, message, errors?: [{ field | rule, message }] }`.

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/auth/register` | public | create a BORROWER (201) |
| POST | `/auth/login` | public | JWT for any role |
| GET | `/auth/me` | any | current profile |
| GET | `/applications/me` | Borrower | own application or `null` |
| PUT | `/applications/me/personal-details` | Borrower | upsert + BRE (200 / **422**) |
| POST | `/applications/me/salary-slip/sign` | Borrower | signed Cloudinary upload ticket (409 if BRE not passed) |
| POST | `/applications/me/salary-slip` | Borrower | `{ publicId, originalName }` → verify asset & link |
| POST | `/loans` | Borrower | apply `{ principal, tenureDays }` (201 / 400 / 409) |
| GET | `/loans/me` | Borrower | own loans |
| GET | `/leads` | Sales | borrowers who haven't applied, with funnel stage |
| GET | `/loans/summary` | executives | counts by status (role-scoped) |
| GET | `/loans?status=` | executives | module queue (role-scoped, **403** otherwise) |
| GET | `/loans/:id` | executives / owner | detail with borrower + application |
| POST | `/loans/:id/sanction` | Sanction | APPLIED → SANCTIONED |
| POST | `/loans/:id/reject` | Sanction | `{ reason }` APPLIED → REJECTED |
| POST | `/loans/:id/disburse` | Disbursement | SANCTIONED → DISBURSED |
| GET | `/loans/:id/payments` | Collection | payment history |
| POST | `/loans/:id/payments` | Collection | `{ utr, amount, paidAt }` → 201, auto-close |

Status codes: 200/201 success · 400 validation · 401 unauthenticated · 403 wrong role ·
404 not found · 409 conflict (duplicate email/UTR, illegal state transition, active loan) ·
422 BRE failed.

---

## Data model

```
User          { name, email (unique), password (bcrypt, select:false), role }
Application   { user (unique) → User, personalDetails{ fullName, pan, dateOfBirth, monthlySalary,
                employmentMode }, bre{ passed, failures[], evaluatedAt },
                salarySlip?{ publicId, originalName, mimeType, size, url, uploadedAt } }
Loan          { user → User, application → Application, principal, tenureDays, interestRate,
                interest, totalRepayment, amountPaid, status, statusHistory[{from,to,by,at,reason?}],
                virtual outstanding }
Payment       { loan → Loan, borrower → User, utr (unique), amount, paidAt, recordedBy → User }
```

---

## Deployment (Vercel, two projects from this repo)

| Project | Root directory | Framework | Env vars |
|---|---|---|---|
| API | `server` | Other | `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN` (comma-separated, `*` wildcards ok), `MAX_FILE_SIZE_MB`, `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`, **`NODEJS_HELPERS=0`** |
| Client | `client` | Next.js | `NEXT_PUBLIC_API_URL=https://<api>.vercel.app/api` |

`server/api/index.ts` wraps the Express app as a serverless function; `vercel.json` rewrites all
paths to it; the Mongo connection is cached across warm invocations. Atlas must allow access from
`0.0.0.0/0` (Vercel IPs are dynamic).

**Known limitation:** Vercel functions cap request bodies at 4.5 MB. Salary slips bypass this
(browser → Cloudinary directly), and the API only ever handles small JSON bodies.

---

## Design notes

- **Validation vs. business rules** — zod validates *shape* (400); the BRE decides *eligibility*
  (422). Keeping them separate gives the borrower rule-level messages, not "invalid input".
- **Failed BRE attempts are saved** so the borrower can fix and resubmit, and Sales can see why a
  lead stalled (`BRE_FAILED` stage).
- **No multi-document transactions** — payment recording uses insert → conditional update →
  compensating delete, so it works on standalone MongoDB as well as Atlas.
- **Uploads are verified server-side** — after the direct-to-Cloudinary upload, the API checks the
  asset via the Admin API (owner namespace, format, size) before linking it; rejected assets are
  destroyed.
- **Progress is derived, not stored** — the portal computes which step is next from the
  application/loan documents, so it can never drift.
