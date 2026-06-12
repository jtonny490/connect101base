# Frontend Plan

## Frontend Goal

Build the user experience for creating escrow deals, funding them, submitting work, reviewing work, opening bounties, and displaying verified Live CV entries.

The frontend should be a thin client. It should render backend state and call backend APIs. It should not be the source of truth for payment, release, or verification.

## Frontend Team Split

### Frontend Engineer 1

Owns:

* Homepage call-to-action flow.
* Dashboard.
* Deal creation form.
* Milestone creation/editing UI.
* Client escrow/funding page.

Main files:

* `frontend/src/app/page.tsx`
* `frontend/src/app/dashboard/page.tsx`
* `frontend/src/app/create-deal/page.tsx`
* New: `frontend/src/app/client/deals/[id]/page.tsx`

### Frontend Engineer 2

Owns:

* Freelancer deal page.
* Deliverable submission flow.
* Live CV public profile.
* Dispute and bounty UI.

Main files:

* `frontend/src/app/freelancer/[id]/page.tsx`
* `frontend/src/app/live-cv/[id]/page.tsx`
* New: `frontend/src/app/bounties/page.tsx`
* New: `frontend/src/app/bounties/[id]/page.tsx`

## Required Pages

### `/create-deal`

Purpose:

Freelancer creates a new escrow deal.

Needs:

* Deal title.
* Description/scope.
* Origin: WhatsApp, Telegram, X, LinkedIn, Upwork, Direct.
* Total amount in sats.
* Milestones.
* Client link output.
* Freelancer link output.

Calls:

* `POST /api/deals`
* `POST /api/deals/:id/invoice`

### `/client/deals/[id]`

Purpose:

Client funds escrow, reviews submitted work, approves, rejects, or opens dispute.

Needs:

* Deal summary.
* Milestone list.
* Lightning invoice QR.
* Payment status.
* Submitted preview URL.
* Sandbox iframe preview.
* Review form.
* Approve/release button.
* Reject/request revision button.
* Open bounty button when eligible.

Calls:

* `GET /api/deals/:id`
* `GET /api/payments/:id/status`
* `POST /api/milestones/:id/approve`
* `POST /api/milestones/:id/reject`
* `POST /api/milestones/:id/bounty`

### `/freelancer/deals/[id]`

Purpose:

Freelancer views funded deal and submits work.

Needs:

* Deal details.
* Milestone statuses.
* Submission form.
* Preview URL input.
* Submission notes.
* Revision request display.
* Payment released state.

Calls:

* `GET /api/deals/:id`
* `POST /api/milestones/:id/submissions`

### `/live-cv/[id]`

Purpose:

Public profile showing verified completed work.

Needs:

* Freelancer identity.
* Trust score.
* Total verified volume.
* Completed deal entries.
* Verification hash per entry.
* Payment-backed badge.

Calls:

* `GET /api/live-cv/:user_id`

### `/bounties`

Purpose:

List open fix bounties for independent developers.

Needs:

* Bounty amount.
* Project title.
* Required fix.
* Deadline.
* Status.

Calls:

* `GET /api/bounties`

### `/bounties/[id]`

Purpose:

Developer views bounty details and submits fix.

Needs:

* Bounty description.
* Original rejected milestone.
* Preview/test requirements.
* Submission URL.
* Submit fix button.
* Accepted/paid state.

Calls:

* `GET /api/bounties/:id`
* `POST /api/bounties/:id/submissions`

## Shared UI Components

Create reusable components when practical:

* `DealStatusBadge`
* `DealTimeline`
* `MilestoneList`
* `MilestoneEditor`
* `InvoiceQr`
* `PreviewSandbox`
* `ReviewForm`
* `BountyCard`
* `LiveCvEntry`
* `VerificationHash`

## UI States

Every page should handle:

* Loading.
* Empty data.
* API error.
* Invalid link.
* Unauthorized action.
* Success confirmation.

## Important Frontend Rules

* Do not store deal truth in `localStorage`.
* Do not trust URL params for deal amount/title.
* Do not mark anything funded from the frontend.
* Do not mark anything released from the frontend.
* Always wait for backend response before changing important status.
* Disable buttons while mutations are in progress.
* Use the backend status field to decide which action is available.

## Current Prototype Cleanup

These prototype routes should be converted:

* `/freelancer/[id]` should become `/freelancer/deals/[id]`.
* `/live-cv/[id]` should load from backend.
* `/create-deal` should create database records.
* Mock invoice data should come from backend, not URL params.

## Frontend Done Criteria

Frontend is ready for the real demo when:

* Client and freelancer pages work on separate browsers.
* Refreshing the page does not lose deal state.
* Live CV entries persist after browser storage is cleared.
* Client cannot approve work before backend says payment is funded.
* Bounty UI appears only after a rejected/disputed milestone.
