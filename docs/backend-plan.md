# Backend Plan

## Backend Goal

Build the trusted backend for escrow deals, milestone payments, submissions, reviews, bounties, and payment-backed Live CV verification.

The backend is the source of truth. It decides whether a deal is funded, whether payment can be released, and whether a CV entry is verified.

## Backend Team Split

### Backend Engineer 1

Owns:

* Supabase project setup.
* Postgres tables.
* Row-level security.
* Auth model.
* Seed data.

### Backend Engineer 2

Owns:

* Deal APIs.
* Milestone APIs.
* Submission APIs.
* Review APIs.
* CV entry generation.
* SHA-256 verification hash logic.

### Backend Engineer 3

Owns:

* Lightning invoice API.
* Payment status checking.
* LNBits/Alby integration.
* Payment receipt storage.
* Release/payment simulation for demo mode.

## Data Model

### `users`

Stores freelancers, clients, and bounty developers.

Fields:

* `id`
* `name`
* `email`
* `role`
* `public_key`
* `lightning_address`
* `trust_score`
* `created_at`

### `deals`

Stores the main agreement.

Fields:

* `id`
* `freelancer_id`
* `client_id`
* `title`
* `description`
* `origin`
* `amount_sats`
* `status`
* `client_token`
* `freelancer_token`
* `created_at`
* `updated_at`

Status values:

* `draft`
* `invoice_created`
* `funded`
* `submitted`
* `revision_requested`
* `approved`
* `released`
* `disputed`
* `bounty_opened`
* `closed`

### `milestones`

Stores payment chunks within a deal.

Fields:

* `id`
* `deal_id`
* `title`
* `description`
* `amount_sats`
* `position`
* `status`
* `created_at`
* `updated_at`

Status values:

* `pending`
* `funded`
* `submitted`
* `approved`
* `released`
* `rejected`
* `bounty_opened`

### `payments`

Stores Lightning invoices and receipts.

Fields:

* `id`
* `deal_id`
* `milestone_id`
* `invoice`
* `checking_id`
* `payment_hash`
* `preimage`
* `amount_sats`
* `status`
* `paid_at`
* `released_at`
* `created_at`

Status values:

* `invoice_created`
* `paid`
* `released`
* `expired`
* `failed`

### `submissions`

Stores freelancer work submissions.

Fields:

* `id`
* `deal_id`
* `milestone_id`
* `submitted_by`
* `preview_url`
* `notes`
* `status`
* `created_at`

Status values:

* `submitted`
* `accepted`
* `rejected`
* `superseded`

### `reviews`

Stores client reviews after release.

Fields:

* `id`
* `deal_id`
* `milestone_id`
* `reviewer_id`
* `rating`
* `comment`
* `created_at`

### `cv_entries`

Stores public Live CV entries.

Fields:

* `id`
* `user_id`
* `deal_id`
* `milestone_id`
* `project_title`
* `amount_sats`
* `review_id`
* `payment_id`
* `verification_hash`
* `completed_at`
* `created_at`

### `disputes`

Stores rejected or contested work.

Fields:

* `id`
* `deal_id`
* `milestone_id`
* `opened_by`
* `reason`
* `status`
* `created_at`
* `resolved_at`

Status values:

* `open`
* `revision_allowed`
* `bounty_opened`
* `resolved`
* `closed`

### `bounties`

Stores fix bounties created from disputed milestone funds.

Fields:

* `id`
* `deal_id`
* `milestone_id`
* `dispute_id`
* `amount_sats`
* `title`
* `description`
* `status`
* `created_at`
* `expires_at`

Status values:

* `open`
* `submitted`
* `accepted`
* `paid`
* `cancelled`

### `bounty_submissions`

Stores independent developer fixes.

Fields:

* `id`
* `bounty_id`
* `developer_id`
* `preview_url`
* `notes`
* `status`
* `created_at`
* `accepted_at`

Status values:

* `submitted`
* `accepted`
* `rejected`

## API Routes

### Deals

```http
POST /api/deals
GET /api/deals/:id
PATCH /api/deals/:id
```

### Milestones

```http
POST /api/deals/:id/milestones
PATCH /api/milestones/:id
```

### Invoices and Payments

```http
POST /api/deals/:id/invoice
POST /api/milestones/:id/invoice
GET /api/payments/:id/status
POST /api/payments/:id/check
POST /api/payments/:id/release
```

### Submissions

```http
POST /api/milestones/:id/submissions
GET /api/milestones/:id/submissions
```

### Approval and Rejection

```http
POST /api/milestones/:id/approve
POST /api/milestones/:id/reject
```

### Live CV

```http
GET /api/live-cv/:user_id
POST /api/deals/:id/cv-entry
```

### Bounties

```http
POST /api/milestones/:id/bounty
GET /api/bounties
GET /api/bounties/:id
POST /api/bounties/:id/submissions
POST /api/bounty-submissions/:id/accept
```

## State Machine Rules

### Deal Funding

* Deal starts as `draft`.
* Invoice creation moves deal to `invoice_created`.
* Verified payment moves deal to `funded`.
* Frontend cannot manually mark a deal as funded.

### Submission

* Freelancer can submit only when milestone is `funded`.
* Submission moves milestone to `submitted`.

### Approval

* Client can approve only submitted work.
* Approval moves milestone to `approved`.

### Release

* Release requires approved milestone and paid payment.
* Release moves payment to `released`.
* Release moves milestone to `released`.
* Release creates Live CV entry.

### Rejection

* Client can reject submitted work.
* Rejection creates a dispute.
* Client can request revision or open bounty.

### Bounty

* Bounty can only be created from rejected/disputed milestone funds.
* Bounty amount cannot exceed unpaid milestone amount.
* Only one bounty submission can be accepted.
* Accepted bounty submission triggers bounty payment/release.

## Verification Hash

Generate Live CV verification hash on the backend only.

Suggested input:

```text
deal_id:milestone_id:freelancer_id:client_id:amount_sats:payment_hash:released_at
```

Node example:

```ts
import { createHash } from 'crypto';

export function createVerificationHash(input: string) {
  return createHash('sha256').update(input).digest('hex');
}
```

## Lightning Integration Plan

### Demo Mode

Use mock invoice and mock payment status while frontend/backend integration is being built.

Mock payment statuses:

* `invoice_created`
* `paid`
* `released`

### Real Mode

Use LNBits or Alby.

Backend should:

* Create invoice.
* Store invoice/checking ID.
* Poll or verify payment status.
* Store payment hash/preimage where available.
* Never trust client-side payment confirmation.

## Backend Done Criteria

Backend is ready when:

* Deals persist in database.
* Client/freelancer links work across devices.
* Payment status is checked server-side.
* Milestones can be approved independently.
* Released milestones create CV entries.
* Verification hashes are generated server-side.
* Rejected milestones can become bounties.
