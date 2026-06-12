# DealLock

Portable trust powered by Bitcoin.

## Problem

Freelancers, consultants, designers, tutors, and contractors often work with clients they meet on platforms like LinkedIn, WhatsApp, X (Twitter), Telegram, Fiverr, and Upwork.

While payments can be completed successfully, there is no portable way to prove that work happened. Reputation remains trapped inside platforms and traditional CVs rely on self-reported information and references.

This creates a trust gap for both workers and clients.

## Solution

DealLock combines Bitcoin-powered escrow with portable reputation.

Every completed contract can become a verifiable work record that updates a freelancer's Live CV.

Instead of simply receiving payment, users build an economic history backed by real milestone funding, delivery, and approval.

## Current Workflow

1. Freelancer creates a deal and defines one or more milestones.
2. Client creates an invoice and funds the deal.
3. The backend marks the deal as funded and milestones become fund-ready.
4. Freelancer submits a deliverable URL for the funded milestone.
5. Client approves the milestone.
6. The backend creates a Live CV entry for the approved milestone.
7. The freelancer's Live CV reflects the verified work record.

### Notes

* Deals are stored in memory during development, so restarting the backend clears state.
* Live CV entries appear only after milestone approval.
* The deal flow now supports custom milestones and a `payInSats` option for BTC-only freelancer payment.

## Features

* Multi-milestone deal builder
* Lightning invoice creation and payment simulation
* Funded milestone state for submission readiness
* Freelancer deliverable preview and sandbox iframe support
* Client approval flow
* Live CV generation from approved milestones
* In-memory backend for fast prototyping

## Tech Stack

Frontend:

* Next.js (App Router)
* React
* TypeScript
* Tailwind CSS

Backend:

* Node.js
* Express
* TypeScript
* In-memory store for deals, milestones, payments, submissions, bounties, and CV entries

## Project structure

The repository has two main workspaces plus docs:

```
./
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts         # Express server and API routes
│   │   ├── store.ts         # in-memory state, deal/milestone/payment helpers
│   │   └── types.ts         # shared backend models and enums
├── docs/
│   ├── architecture.md
│   ├── backend-plan.md
│   ├── db-schema.md
│   ├── demo-script.md
│   ├── frontend-plan.md
│   ├── problem-solution.md
│   └── team-build-plan.md
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── .env.local
│   ├── src/
│   │   └── app/
│   │       ├── api/create-invoice/route.ts
│   │       ├── create-deal/page.tsx
│   │       ├── dashboard/page.tsx
│   │       ├── client/deals/[id]/page.tsx
│   │       ├── freelancer/[id]/page.tsx
│   │       ├── live-cv/[id]/page.tsx
│   │       ├── globals.css
│   │       ├── layout.tsx
│   │       └── navbar.tsx
│   └── public/
└── README.md
```

## Running locally

1. Start the backend:

```bash
cd backend
npm install
npm run dev
```

2. Start the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

3. Create a deal in the frontend, fund it, submit work, and approve the milestone.

## Vision

Every completed payment should become proof of work.

DealLock turns funded and approved milestones into a portable reputation record.
