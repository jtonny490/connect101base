# Backend Development Split

Two backend developers can work independently by owning separate route modules.

## Backend Dev A: Deal & Payment Workflow
**Files to own and commit:**
- `backend/src/dealRoutes.ts`

**Owns these endpoints:**
- `POST /api/deals` — create deal with milestones
- `GET /api/deals/:id` — fetch deal details
- `PATCH /api/deals/:id` — update deal
- `POST /api/deals/:id/invoice` — generate payment invoice
- `GET /api/payments/:id/status` — check payment status
- `POST /api/payments/:id/check` — mark payment as paid
- `POST /api/payments/:id/release` — release payment
- `POST /api/deals/:id/milestones` — add milestone to deal

## Backend Dev B: Milestone, Bounty & Live CV
**Files to own and commit:**
- `backend/src/milestoneRoutes.ts`

**Owns these endpoints:**
- `POST /api/milestones/:id/submissions` — submit work on milestone
- `GET /api/milestones/:id/submissions` — fetch milestone submissions
- `GET /api/milestones/:id` — fetch milestone details
- `POST /api/milestones/:id/approve` — approve milestone (creates CV entry)
- `POST /api/milestones/:id/reject` — reject milestone
- `POST /api/milestones/:id/bounty` — open bounty on rejected milestone
- `GET /api/bounties` — list open bounties
- `GET /api/bounties/:id` — fetch bounty details
- `POST /api/bounties/:id/submissions` — submit bounty fix
- `GET /api/bounties/:id/submissions` — fetch bounty submissions
- `POST /api/bounty-submissions/:id/accept` — accept bounty submission (creates CV entry)
- `GET /api/live-cv/:userId` — fetch user's live CV entries

## Shared Files (Coordinate commits)
- `backend/src/index.ts` — wires both routers
- `backend/src/store.ts` — shared in-memory data store
- `backend/src/helpers.ts` — shared utilities (createId, estimateLocalAmount)
- `backend/src/types.ts` — shared TypeScript types

---

### Workflow
1. **Dev A** commits changes to `dealRoutes.ts`
2. **Dev B** commits changes to `milestoneRoutes.ts`
3. **Shared commits** go to `index.ts`, `store.ts`, `helpers.ts`, `types.ts` (coordinate with team)

### Testing
Run `npm run dev` in backend — both routes are automatically mounted and ready.


backend/src/index.ts
backend/src/dealRoutes.ts          (Dev A)
backend/src/milestoneRoutes.ts     (Dev B)
backend/src/helpers.ts             (Shared)
backend/src/store.ts               (Shared)
backend/src/types.ts               (Shared)
backend/package.json               (Shared)
backend/package-lock.json          (Shared)
backend/tsconfig.json