import { randomBytes } from 'crypto';
function createId(prefix) {
    return `${prefix}_${randomBytes(6).toString('hex')}`;
}
function now() {
    return new Date().toISOString();
}
export const users = [
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
export const deals = [];
export const milestones = [];
export const payments = [];
export const submissions = [];
export const bounties = [];
export const bountySubmissions = [];
export const cvEntries = [];
export function createDeal(input) {
    const deal = {
        id: createId('deal'),
        freelancerId: input.freelancerId,
        clientId: input.clientId,
        title: input.title,
        description: input.description,
        origin: input.origin,
        amountSats: input.amountSats,
        amountLocal: input.amountLocal,
        localCurrency: input.localCurrency || 'KES',
        status: 'draft',
        clientToken: createId('client'),
        freelancerToken: createId('freelancer'),
        createdAt: now(),
        updatedAt: now(),
    };
    deals.push(deal);
    return deal;
}
export function getDeal(id) {
    return deals.find((deal) => deal.id === id);
}
export function updateDeal(id, patch) {
    const deal = getDeal(id);
    if (!deal)
        return null;
    Object.assign(deal, patch, { updatedAt: now() });
    return deal;
}
export function createMilestone(input) {
    const milestone = {
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
export function getMilestone(id) {
    return milestones.find((milestone) => milestone.id === id);
}
export function updateMilestone(id, patch) {
    const milestone = getMilestone(id);
    if (!milestone)
        return null;
    Object.assign(milestone, patch, { updatedAt: now() });
    return milestone;
}
const exchangeRates = {
    KES: 0.23,
    UGX: 0.34,
    NGN: 2.5,
    USD: 0.025,
    EUR: 0.023,
};
export function estimateLocalAmount(amountSats, currency) {
    const rate = exchangeRates[currency.toUpperCase()] ?? exchangeRates.USD;
    return Math.max(1, Math.round(amountSats * rate));
}
export function createPayment(input) {
    const amountLocal = estimateLocalAmount(input.amountSats, input.localCurrency);
    const payment = {
        id: createId('pay'),
        dealId: input.dealId,
        milestoneId: input.milestoneId,
        provider: input.provider,
        amountSats: input.amountSats,
        amountLocal,
        localCurrency: input.localCurrency,
        status: 'invoice_created',
        invoice: input.provider === 'lightning'
            ? `lnbc${input.amountSats}n1demo${createId('inv').substring(0, 20)}`
            : undefined,
        instructions: input.provider === 'mpesa'
            ? `Send KES ${amountLocal} to 0722-000-000 and enter code ${createId('mpesa').substring(3, 9)}`
            : undefined,
        externalId: createId('ext'),
        createdAt: now(),
        updatedAt: now(),
    };
    payments.push(payment);
    return payment;
}
export function getPayment(id) {
    return payments.find((payment) => payment.id === id);
}
export function updatePayment(id, patch) {
    const payment = getPayment(id);
    if (!payment)
        return null;
    Object.assign(payment, patch, { updatedAt: now() });
    return payment;
}
export function createSubmission(input) {
    const submission = {
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
export function createBounty(input) {
    const bounty = {
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
export function getBounty(id) {
    return bounties.find((bounty) => bounty.id === id);
}
export function createBountySubmission(input) {
    const submission = {
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
export function getBountySubmission(id) {
    return bountySubmissions.find((submission) => submission.id === id);
}
export function createCvEntry(input) {
    const entry = {
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
export function getCvForUser(userId) {
    return cvEntries.filter((entry) => entry.userId === userId);
}
