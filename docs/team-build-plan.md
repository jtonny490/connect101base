# Team Build Plan

## Product Goal

Build a Bitcoin Lightning escrow platform for freelancers who close work through WhatsApp, Telegram, X, LinkedIn, Upwork DMs, and other off-platform channels.

The platform should let a freelancer create a deal, send a client funding link, submit work, receive instant Lightning payment after approval, and automatically add the completed deal to a public Live CV as a verified payment-backed entry.

## Team Split

The team has five people:

* Frontend Engineer 1: Deal creation, client escrow flow, milestone UI.
* Frontend Engineer 2: Freelancer dashboard, Live CV, bounty/dispute UI.
* Backend Engineer 1: Database schema, Supabase setup, auth, row-level security.
* Backend Engineer 2: Deal state machine, milestones, submissions, reviews, CV hashes.
* Backend Engineer 3: Lightning integration, invoice creation, payment checking, release simulation/settlement.

## Build Phases

### Phase 1: Replace Browser Storage

Current app state is stored in `localStorage`. This only works in one browser and is not enough for real client/freelancer links.

Goal:

* Store deals in Supabase/Postgres.
* Client link and freelancer link should work across devices.
* Keep Lightning mocked if needed.

Done when:

* A deal created on one browser can be opened from another browser using the generated links.
* Freelancer submission appears for the client without using `localStorage`.

### Phase 2: Real Deal Lifecycle

Goal:

* Implement deal statuses on the backend.
* Frontend should render based on backend status, not local UI state.

Deal statuses:

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

Done when:

* The client cannot approve before funding.
* The freelancer cannot submit to a nonexistent deal.
* Every status change is written to the database.

### Phase 3: Milestones

Goal:

* Deals can be split into milestones with separate amounts and approval states.

Milestone statuses:

* `pending`
* `funded`
* `submitted`
* `approved`
* `released`
* `rejected`
* `bounty_opened`

Done when:

* Freelancer can create or review milestones during deal creation.
* Client can approve one milestone without releasing all funds.
* Live CV only includes completed/released work.

### Phase 4: Lightning Integration

Goal:

* Create Lightning invoices through LNBits or Alby.
* Check payment status from backend.
* Release payments after approval.

Done when:

* Client sees a real Lightning invoice.
* Backend can verify payment before marking a deal or milestone as funded.
* Completed payment receipts are stored for CV verification.

### Phase 5: Verified Live CV

Goal:

* Completed paid work creates a public CV entry.
* The entry has a server-generated SHA-256 verification hash.

Hash input:

```text
deal_id:freelancer_id:client_id:amount_sats:payment_hash:released_at
```

Done when:

* Public CV pages load from database, not `localStorage`.
* A completed deal automatically creates a CV entry.
* The same deal data always produces the same verification hash.

### Phase 6: Disputes and Bounties

Goal:

* If a client rejects a milestone, the remaining unpaid amount can become a bounty for independent developers.

Flow:

* Client rejects milestone.
* Freelancer can revise or dispute.
* If unresolved, remaining milestone amount becomes a bounty.
* Other developers submit fixes.
* Client accepts one fix.
* Bounty winner gets paid.
* Original freelancer keeps already released milestone payments.

Done when:

* Bounties are linked to a rejected milestone.
* Bounty submissions are tracked.
* Only one accepted bounty submission can be paid.

## Frontend Responsibilities

Frontend should not decide whether money is paid or whether a CV entry is verified. It should call backend APIs and render backend state.

Frontend pages:

* `/`
* `/dashboard`
* `/create-deal`
* `/client/deals/[id]`
* `/freelancer/deals/[id]`
* `/live-cv/[id]`
* `/bounties`
* `/bounties/[id]`

Frontend components:

* Deal form
* Milestone editor
* Invoice QR panel
* Deal status timeline
* Deliverable submission form
* Sandbox preview frame
* Review/release panel
* Dispute panel
* Bounty card
* Live CV entry card
* Verification hash display

Frontend API expectations:

* Use loading states for all mutations.
* Disable invalid actions based on backend status.
* Show clear empty states.
* Poll or subscribe to deal updates while a deal is active.
* Never trust URL params as final deal data.

## Backend Responsibilities

Backend owns all trusted state.

Backend must handle:

* Users
* Deals
* Milestones
* Payments
* Submissions
* Reviews
* CV entries
* Disputes
* Bounties
* Bounty submissions

Backend rules:

* Only the deal client can approve/reject work.
* Only the freelancer can submit work to their own deal.
* A deal cannot be marked funded until payment is verified.
* Funds cannot be released twice.
* A CV entry cannot exist without a released payment.
* Bounties can only be opened from rejected/disputed milestone funds.

## Suggested API Contract

### Deals

```http
POST /api/deals
GET /api/deals/:id
PATCH /api/deals/:id
```

Create deal request:

```json
{
  "title": "Landing Page Redesign",
  "description": "Build a responsive landing page",
  "amount_sats": 10000,
  "origin": "whatsapp",
  "freelancer_id": "user_id",
  "milestones": [
    {
      "title": "Design",
      "amount_sats": 3000
    },
    {
      "title": "Build",
      "amount_sats": 7000
    }
  ]
}
```

### Invoices

```http
POST /api/deals/:id/invoice
GET /api/payments/:id/status
```

### Submissions

```http
POST /api/milestones/:id/submissions
```

Submission request:

```json
{
  "preview_url": "https://example.vercel.app",
  "notes": "Ready for review"
}
```

### Approval and Release

```http
POST /api/milestones/:id/approve
POST /api/milestones/:id/reject
POST /api/milestones/:id/release
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

## Demo Path For Current Prototype

Until the backend is built, the demo works in one browser only.

Steps:

* Open `/create-deal`.
* Create a deal.
* Open freelancer view.
* Submit `https://example.vercel.app`.
* Open client view.
* Confirm mock payment.
* Move to waiting delivery.
* View submitted work.
* Approve and release.
* Show the new Live CV entry.

## First Sprint Recommendation

Sprint goal:

Replace `localStorage` with Supabase-backed deals and submissions.

Frontend tasks:

* Frontend Engineer 1 converts `/create-deal` to call `POST /api/deals`.
* Frontend Engineer 1 builds milestone input UI.
* Frontend Engineer 2 converts freelancer page to load deal by ID from backend.
* Frontend Engineer 2 converts Live CV to load entries from backend.

Backend tasks:

* Backend Engineer 1 creates Supabase tables and policies.
* Backend Engineer 2 creates deal, milestone, submission, review, and CV APIs.
* Backend Engineer 3 creates mock Lightning invoice APIs first, then swaps to LNBits.

Sprint done when:

* A deal created in one browser can be opened in another browser.
* Freelancer submission appears to the client from the database.
* Client approval creates a database-backed Live CV entry.
