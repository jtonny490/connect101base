# System Architecture

For the implementation split, see:

* `docs/team-build-plan.md`
* `docs/frontend-plan.md`
* `docs/backend-plan.md`

## High Level Flow

Client
↓
DealLock Frontend
↓
Supabase Backend
↓
Lightning Escrow Service
↓
Reputation Engine
↓
Live CV

## Components

### Frontend

Responsibilities:

* User dashboard
* Deal creation
* Live CV display
* Reputation pages

Technology:

* Next.js
* TypeScript
* Tailwind CSS

### Backend

Responsibilities:

* Authentication
* Database
* Contract storage
* Review storage

Technology:

* Supabase
* PostgreSQL

### Escrow Layer

Responsibilities:

* Invoice creation
* Payment verification
* Fund release

Technology:

* Lightning Network
* LNBits
* Alby

### Reputation Engine

Responsibilities:

* Trust score generation
* Verified work history
* Review aggregation

Inputs:

* Completed deals
* Reviews
* Payment confirmations

Outputs:

* Live CV
* Trust Score

## Data Flow

Create Deal
↓
Generate Lightning Invoice
↓
Client Pays
↓
Escrow Activated
↓
Work Completed
↓
Release Funds
↓
Generate Proof of Work
↓
Update Live CV
↓
Update Trust Score
