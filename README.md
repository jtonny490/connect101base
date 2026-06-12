# DealLock

Portable trust powered by Bitcoin.

## Problem

Freelancers, consultants, designers, tutors, and contractors often work with clients they meet on platforms like LinkedIn, WhatsApp, X (Twitter), Telegram, Fiverr, and Upwork.

While payments can be completed successfully, there is no portable way to prove that work happened. Reputation remains trapped inside platforms and traditional CVs rely on self-reported information and references.

This creates a trust gap for both workers and clients.

## Solution

DealLock combines Bitcoin-powered escrow with portable reputation.

Every completed contract creates a verifiable proof-of-work record that automatically updates a user's Live CV.

Instead of simply getting paid, users build a permanent work history backed by real economic activity.

## How It Works

1. Freelancer creates a DealLock contract.
2. Client funds the contract through Bitcoin Lightning escrow.
3. Work is completed.
4. Client releases funds.
5. DealLock automatically generates a verified work record.
6. Freelancer's Live CV and Trust Score are updated.

## Features

* Bitcoin Lightning escrow
* Portable reputation system
* Live CV generation
* Trust score calculation
* Cross-platform contract links
* Verified project history
* Client reviews tied to completed payments

## Why Bitcoin

Traditional payment systems can move money but cannot easily create programmable trust.

Bitcoin Lightning enables:

* Fast settlement
* Low fees
* Global accessibility
* Escrow workflows
* Cryptographic verification

DealLock transforms financial activity into reputation.

## Example

A designer completes a $300 project.

Instead of simply receiving payment:

* Funds are released.
* The project is verified.
* A review is attached.
* A new entry appears on the designer's Live CV.

## Future Roadmap

* Multi-milestone contracts
* M-Pesa integration
* Team contracts
* Reputation export APIs
* DAO-based dispute resolution
* Employer verification portal

## Tech Stack

Frontend:

* Next.js
* TypeScript
* Tailwind CSS

Backend:

* Supabase
* PostgreSQL

Bitcoin Layer:

* Lightning Network
* LNBits / Alby APIs

## Project structure

This repository is split into frontend and backend responsibilities.

* `/frontend` — Next.js user interface, deal creation, client and freelancer workflows, Live CV pages, and initial API route prototypes.
* `/backend` — new Express/TypeScript service for deal state, milestone workflows, invoice generation, payment status, dispute/bounty flows, and Live CV verification.
* `/docs` — product plans, architecture, backend design, and frontend feature roadmap.

Backend structure:

* `/backend/package.json`
* `/backend/tsconfig.json`
* `/backend/src/index.ts` — main Express server and API routes
* `/backend/src/store.ts` — in-memory state store, deal and payment helpers
* `/backend/src/types.ts` — shared backend data models and statuses

Frontend structure:

* `/frontend/src/app/page.tsx` — marketing/home page
* `/frontend/src/app/dashboard/page.tsx` — dashboard summary
* `/frontend/src/app/create-deal/page.tsx` — deal creation flow
* `/frontend/src/app/freelancer/[id]/page.tsx` — freelancer deal workspace
* `/frontend/src/app/live-cv/[id]/page.tsx` — public Live CV experience
* `/frontend/src/app/api/create-invoice/route.ts` — existing invoice API prototype

## Vision

Every completed payment should become proof of work.

DealLock turns financial transactions into portable trust.
