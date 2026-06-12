import express from 'express';
import cors from 'cors';
import {
  bounties,
  bountySubmissions,
  createBounty,
  createBountySubmission,
  createCvEntry,
  createDeal,
  createMilestone,
  createPayment,
  createSubmission,
  getBounty,
  getBountySubmission,
  getCvForUser,
  getDeal,
  getMilestone,
  getPayment,
  updateDeal,
  updateMilestone,
  updatePayment,
  users,
  submissions,
  payments,
  milestones,
} from './store.js';

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/deals', (req, res) => {
  const { title, description, origin, amountSats, localCurrency, milestones: incomingMilestones, payInSats } = req.body;
  if (!title || !amountSats) {
    return res.status(400).json({ error: 'Missing title or amountSats' });
  }

  const deal = createDeal({
    title,
    description,
    origin,
    amountSats: Number(amountSats),
    localCurrency: localCurrency || 'KES',
    amountLocal: 0,
    freelancerId: users[0].id,
    clientId: users[1].id,
    payInSats: Boolean(payInSats),
  });

  let createdMilestoneId: string | null = null;
  if (Array.isArray(incomingMilestones) && incomingMilestones.length > 0) {
    incomingMilestones.forEach((m: any, idx: number) => {
      const ms = createMilestone({
        dealId: deal.id,
        title: m.title || `Milestone ${idx + 1}`,
        description: m.description || undefined,
        amountSats: Number(m.amountSats || m.amount || 0),
        position: Number(m.position ?? idx + 1),
      });
      if (idx === 0) createdMilestoneId = ms.id;
    });
  } else {
    const defaultMilestone = createMilestone({
      dealId: deal.id,
      title: 'Full project milestone',
      description: 'Default milestone for the full escrow amount',
      amountSats: deal.amountSats,
      position: 1,
    });
    createdMilestoneId = defaultMilestone.id;
  }

  return res.status(201).json({ ...deal, defaultMilestoneId: createdMilestoneId });
});

app.get('/api/deals/:id', (req, res) => {
  const deal = getDeal(req.params.id);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });

  const dealMilestones = milestones.filter((milestone) => milestone.dealId === deal.id);
  const dealPayments = payments.filter((payment) => payment.dealId === deal.id);

  return res.json({ deal, milestones: dealMilestones, payments: dealPayments });
});

app.patch('/api/deals/:id', (req, res) => {
  const updated = updateDeal(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Deal not found' });
  return res.json(updated);
});

app.post('/api/deals/:id/invoice', (req, res) => {
  const deal = getDeal(req.params.id);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });

  const provider = req.body.provider === 'mpesa' ? 'mpesa' : 'lightning';
  const currency = String(req.body.currency || deal.localCurrency || 'KES').toUpperCase();

  const payment = createPayment({
    dealId: deal.id,
    provider,
    amountSats: deal.amountSats,
    localCurrency: currency,
  });

  updateDeal(deal.id, { status: 'invoice_created' });
  return res.status(201).json(payment);
});

app.get('/api/payments/:id/status', (req, res) => {
  const payment = getPayment(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  return res.json({ status: payment.status, payment });
});

app.post('/api/payments/:id/check', (req, res) => {
  const payment = getPayment(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  
  const deal = getDeal(payment.dealId);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });

  const updatedPayment = updatePayment(payment.id, { status: 'paid' });
  updateDeal(deal.id, { status: 'funded' });

  const dealMilestones = milestones.filter((milestone) => milestone.dealId === deal.id);
  dealMilestones.forEach((milestone) => {
    if (milestone.status === 'pending') {
      updateMilestone(milestone.id, { status: 'funded' });
    }
  });

  return res.json({ status: 'paid', payment: updatedPayment });
});

app.post('/api/payments/:id/release', (req, res) => {
  const payment = getPayment(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  const deal = getDeal(payment.dealId);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });

  updatePayment(payment.id, { status: 'released' });
  updateDeal(deal.id, { status: 'released' });
  return res.json({ status: 'released' });
});

app.post('/api/milestones/:id/submissions', (req, res) => {
  const milestone = getMilestone(req.params.id);
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

  const { previewUrl, notes } = req.body;
  if (!previewUrl) return res.status(400).json({ error: 'Missing previewUrl' });

  const submission = createSubmission({
    dealId: milestone.dealId,
    milestoneId: milestone.id,
    developerId: users[0].id,
    previewUrl,
    notes,
  });

  updateMilestone(milestone.id, { status: 'submitted' });
  return res.status(201).json(submission);
});

app.get('/api/milestones/:id/submissions', (req, res) => {
  const milestone = getMilestone(req.params.id);
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

  const milestoneSubmissions = submissions.filter((submission) => submission.milestoneId === milestone.id);
  return res.json({ milestone, submissions: milestoneSubmissions });
});

app.get('/api/bounties/:id/submissions', (req, res) => {
  const bounty = getBounty(req.params.id);
  if (!bounty) return res.status(404).json({ error: 'Bounty not found' });

  const submissionsForBounty = bountySubmissions.filter((submission) => submission.bountyId === bounty.id);
  return res.json({ bounty, submissions: submissionsForBounty });
});

app.post('/api/milestones/:id/approve', (req, res) => {
  const milestone = getMilestone(req.params.id);
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
  updateMilestone(milestone.id, { status: 'approved' });
  return res.json({ milestone });
});

app.post('/api/milestones/:id/reject', (req, res) => {
  const milestone = getMilestone(req.params.id);
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
  updateMilestone(milestone.id, { status: 'rejected' });
  return res.json({ milestone });
});

app.post('/api/milestones/:id/bounty', (req, res) => {
  const milestone = getMilestone(req.params.id);
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
  if (milestone.status !== 'rejected' && milestone.status !== 'disputed') {
    return res.status(400).json({ error: 'Bounty can only be opened from rejected or disputed milestone funds' });
  }

  const amountSats = Number(req.body.amountSats || milestone.amountSats);
  if (amountSats > milestone.amountSats) {
    return res.status(400).json({ error: 'Bounty amount cannot exceed milestone amount' });
  }

  const bounty = createBounty({
    dealId: milestone.dealId,
    milestoneId: milestone.id,
    title: req.body.title || `Fix for ${milestone.title}`,
    description: req.body.description,
    amountSats,
  });

  updateMilestone(milestone.id, { bountyOpened: true, status: 'bounty_opened' });
  return res.status(201).json(bounty);
});

app.get('/api/bounties', (_req, res) => {
  return res.json(bounties.filter((bounty) => bounty.status === 'open'));
});

app.get('/api/bounties/:id', (req, res) => {
  const bounty = getBounty(req.params.id);
  if (!bounty) return res.status(404).json({ error: 'Bounty not found' });
  return res.json(bounty);
});

app.post('/api/bounties/:id/submissions', (req, res) => {
  const bounty = getBounty(req.params.id);
  if (!bounty) return res.status(404).json({ error: 'Bounty not found' });
  if (bounty.status !== 'open') return res.status(400).json({ error: 'Bounty is not open' });

  const { previewUrl, notes } = req.body;
  if (!previewUrl) return res.status(400).json({ error: 'Missing previewUrl' });

  const submission = createBountySubmission({
    bountyId: bounty.id,
    developerId: users[0].id,
    previewUrl,
    notes,
  });

  return res.status(201).json(submission);
});

app.post('/api/bounty-submissions/:id/accept', (req, res) => {
  const submission = getBountySubmission(req.params.id);
  if (!submission) return res.status(404).json({ error: 'Bounty submission not found' });

  const bounty = getBounty(submission.bountyId);
  if (!bounty) return res.status(404).json({ error: 'Bounty not found' });
  if (bounty.status !== 'open') return res.status(400).json({ error: 'Bounty is already closed' });

  submission.status = 'accepted';
  updateDeal(bounty.dealId, { status: 'bounty_opened' });
  bounty.status = 'closed';

  const deal = getDeal(bounty.dealId);
  if (deal) {
    createCvEntry({
      userId: users[0].id,
      dealId: deal.id,
      milestoneId: bounty.milestoneId,
      title: bounty.title,
      amountSats: bounty.amountSats,
      amountLocal: estimateLocalAmount(bounty.amountSats, deal.localCurrency || 'KES'),
      localCurrency: deal.localCurrency || 'KES',
      preimage: createId('cv'),
      review: `Accepted bounty for milestone ${bounty.milestoneId}`,
    });
  }

  return res.json({ submission, bounty });
});

app.get('/api/live-cv/:userId', (req, res) => {
  const user = users.find((u) => u.id === req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user, entries: getCvForUser(user.id) });
});

app.get('/api/milestones/:id', (req, res) => {
  const milestone = getMilestone(req.params.id);
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
  return res.json(milestone);
});

app.post('/api/deals/:id/milestones', (req, res) => {
  const deal = getDeal(req.params.id);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });
  const { title, description, amountSats, position } = req.body;
  if (!title || !amountSats || position == null) {
    return res.status(400).json({ error: 'Missing milestone title, amountSats, or position' });
  }

  const milestone = createMilestone({
    dealId: deal.id,
    title,
    description,
    amountSats: Number(amountSats),
    position: Number(position),
  });

  return res.status(201).json(milestone);
});

function estimateLocalAmount(amountSats: number, currency: string) {
  const rateMap: Record<string, number> = {
    KES: 0.23,
    UGX: 0.34,
    NGN: 2.5,
    USD: 0.025,
    EUR: 0.023,
  };
  return Math.max(1, Math.round(amountSats * (rateMap[currency.toUpperCase()] ?? rateMap.USD)));
}

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

app.listen(port, () => {
  console.log(`DealLock backend listening at http://localhost:${port}`);
});
