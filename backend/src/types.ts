export type DealStatus =
  | 'draft'
  | 'invoice_created'
  | 'funded'
  | 'submitted'
  | 'awaiting_revision'
  | 'approved'
  | 'released'
  | 'rejected'
  | 'disputed'
  | 'bounty_opened'
  | 'closed';

export type MilestoneStatus =
  | 'pending'
  | 'funded'
  | 'submitted'
  | 'approved'
  | 'released'
  | 'rejected'
  | 'disputed'
  | 'bounty_opened';

export type PaymentProvider = 'lightning' | 'mpesa';

export interface User {
  id: string;
  name: string;
  role: 'freelancer' | 'client' | 'bounty_developer';
  lightningAddress?: string;
  country?: string;
  localCurrency?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  freelancerId: string;
  clientId: string;
  title: string;
  description?: string;
  origin?: string;
  amountSats: number;
  amountLocal?: number;
  localCurrency?: string;
  payInSats?: boolean;
  status: DealStatus;
  clientToken: string;
  freelancerToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  dealId: string;
  title: string;
  description?: string;
  amountSats: number;
  position: number;
  status: MilestoneStatus;
  bountyOpened?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  dealId: string;
  milestoneId?: string;
  provider: PaymentProvider;
  amountSats: number;
  amountLocal: number;
  localCurrency: string;
  status: 'invoice_created' | 'paid' | 'released';
  invoice?: string;
  instructions?: string;
  externalId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  dealId: string;
  milestoneId: string;
  developerId: string;
  previewUrl: string;
  notes?: string;
  status: 'submitted' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Bounty {
  id: string;
  dealId: string;
  milestoneId: string;
  title: string;
  description?: string;
  amountSats: number;
  status: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface BountySubmission {
  id: string;
  bountyId: string;
  developerId: string;
  previewUrl: string;
  notes?: string;
  status: 'submitted' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CvEntry {
  id: string;
  userId: string;
  dealId: string;
  milestoneId?: string;
  title: string;
  amountSats: number;
  localCurrency: string;
  amountLocal: number;
  preimage: string;
  verifiedAt: string;
  review?: string;
}
