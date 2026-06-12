import type {
  Bounty,
  BountySubmission,
  CvEntry,
  Deal,
  Milestone,
  Payment,
  Submission,
  User,
} from './types.js';
import { createId, estimateLocalAmount } from './helpers.js';

function now() {
  return new Date().toISOString();
}

export const users: User[] = [
  {
    id: 'user_freelancer_1',
    slug: 'juma-codes',
    name: 'Freelancer Juma',
    role: 'freelancer',
    lightningAddress: 'juma@lightning.example',
    country: 'KE',
    localCurrency: 'KES',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'user_client_1',
    slug: 'client-amina',
    name: 'Client Amina',
    role: 'client',
    lightningAddress: 'amina@lightning.example',
    country: 'KE',
    localCurrency: 'KES',
    createdAt: now(),
    updatedAt: now(),
  },
];

export const deals: Deal[] = [];
export const milestones: Milestone[] = [];
export const payments: Payment[] = [];
export const submissions: Submission[] = [];
export const bounties: Bounty[] = [];
export const bountySubmissions: BountySubmission[] = [];
export const cvEntries: CvEntry[] = [];

export function createDeal(input: {
  freelancerId: string;
  clientId: string;
  title: string;
  description?: string;
  origin?: string;
  amountSats: number;
  localCurrency?: string;
  amountLocal?: number;
  payInSats?: boolean;
}): Deal {
  const deal: Deal = {
    id: createId('deal'),
    freelancerId: input.freelancerId,
    clientId: input.clientId,
    title: input.title,
    description: input.description,
    origin: input.origin,
    amountSats: input.amountSats,
    amountLocal: input.amountLocal,
    localCurrency: input.localCurrency || 'KES',
    payInSats: input.payInSats ?? false,
    status: 'draft',
    clientToken: createId('client'),
    freelancerToken: createId('freelancer'),
    createdAt: now(),
    updatedAt: now(),
  };
  deals.push(deal);
  return deal;
}

export function getDeal(id: string) {
  return deals.find((deal) => deal.id === id);
}

export function updateDeal(id: string, patch: Partial<Deal>) {
  const deal = getDeal(id);
  if (!deal) return null;
  Object.assign(deal, patch, { updatedAt: now() });
  return deal;
}

export function createMilestone(input: {
  dealId: string;
  title: string;
  description?: string;
  amountSats: number;
  position: number;
}): Milestone {
  const milestone: Milestone = {
    id: createId('ms'),
    dealId: input.dealId,
    title: input.title,
    description: input.description,
    amountSats: input.amountSats,
    position: input.position,
    status: 'pending',
    createdAt: now(),
    updatedAt: now(),
  };
  milestones.push(milestone);
  return milestone;
}

export function getMilestone(id: string) {
  return milestones.find((milestone) => milestone.id === id);
}

export function updateMilestone(id: string, patch: Partial<Milestone>) {
  const milestone = getMilestone(id);
  if (!milestone) return null;
  Object.assign(milestone, patch, { updatedAt: now() });
  return milestone;
}

const exchangeRates: Record<string, number> = {
  KES: 0.23,
  UGX: 0.34,
  NGN: 2.5,
  USD: 0.025,
  EUR: 0.023,
};

export function createPayment(input: {
  dealId: string;
  milestoneId?: string;
  provider: 'lightning' | 'mpesa';
  amountSats: number;
  localCurrency: string;
}): Payment {
  const amountLocal = estimateLocalAmount(input.amountSats, input.localCurrency);
  const payment: Payment = {
    id: createId('pay'),
    dealId: input.dealId,
    milestoneId: input.milestoneId,
    provider: input.provider,
    amountSats: input.amountSats,
    amountLocal,
    localCurrency: input.localCurrency,
    status: 'invoice_created',
    invoice:
      input.provider === 'lightning'
        ? `lnbc${input.amountSats}n1demo${createId('inv').substring(0, 20)}`
        : undefined,
    instructions:
      input.provider === 'mpesa'
        ? `Send KES ${amountLocal} to 0722-000-000 and enter code ${createId('mpesa').substring(3, 9)}`
        : undefined,
    externalId: createId('ext'),
    createdAt: now(),
    updatedAt: now(),
  };
  payments.push(payment);
  return payment;
}

export function getPayment(id: string) {
  return payments.find((payment) => payment.id === id);
}

export function updatePayment(id: string, patch: Partial<Payment>) {
  const payment = getPayment(id);
  if (!payment) return null;
  Object.assign(payment, patch, { updatedAt: now() });
  return payment;
}

export function createSubmission(input: {
  dealId: string;
  milestoneId: string;
  developerId: string;
  previewUrl: string;
  notes?: string;
}): Submission {
  const submission: Submission = {
    id: createId('sub'),
    dealId: input.dealId,
    milestoneId: input.milestoneId,
    developerId: input.developerId,
    previewUrl: input.previewUrl,
    notes: input.notes,
    status: 'submitted',
    createdAt: now(),
    updatedAt: now(),
  };
  submissions.push(submission);
  return submission;
}

export function createBounty(input: {
  dealId: string;
  milestoneId: string;
  title: string;
  description?: string;
  amountSats: number;
}): Bounty {
  const bounty: Bounty = {
    id: createId('bty'),
    dealId: input.dealId,
    milestoneId: input.milestoneId,
    title: input.title,
    description: input.description,
    amountSats: input.amountSats,
    status: 'open',
    createdAt: now(),
    updatedAt: now(),
  };
  bounties.push(bounty);
  return bounty;
}

export function getBounty(id: string) {
  return bounties.find((bounty) => bounty.id === id);
}

export function createBountySubmission(input: {
  bountyId: string;
  developerId: string;
  previewUrl: string;
  notes?: string;
}): BountySubmission {
  const submission: BountySubmission = {
    id: createId('bst'),
    bountyId: input.bountyId,
    developerId: input.developerId,
    previewUrl: input.previewUrl,
    notes: input.notes,
    status: 'submitted',
    createdAt: now(),
    updatedAt: now(),
  };
  bountySubmissions.push(submission);
  return submission;
}

export function getBountySubmission(id: string) {
  return bountySubmissions.find((submission) => submission.id === id);
}

export function createCvEntry(input: {
  userId: string;
  dealId: string;
  milestoneId?: string;
  title: string;
  amountSats: number;
  localCurrency: string;
  amountLocal: number;
  preimage: string;
  review?: string;
}): CvEntry {
  const entry: CvEntry = {
    id: createId('cv'),
    userId: input.userId,
    dealId: input.dealId,
    milestoneId: input.milestoneId,
    title: input.title,
    amountSats: input.amountSats,
    localCurrency: input.localCurrency,
    amountLocal: input.amountLocal,
    preimage: input.preimage,
    verifiedAt: now(),
    review: input.review,
  };
  cvEntries.push(entry);
  return entry;
}

export function getCvForUser(userId: string) {
  return cvEntries.filter((entry) => entry.userId === userId);
}
