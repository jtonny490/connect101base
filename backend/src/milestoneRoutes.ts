import express from 'express';
import {
  bounties,
  bountySubmissions,
  createBounty,
  createBountySubmission,
  createCvEntry,
  createSubmission,
  getBounty,
  getBountySubmission,
  getCvForUser,
  getDeal,
  getMilestone,
  submissions,
  updateDeal,
  updateMilestone,
  users,
} from './store.js';
import { createId, estimateLocalAmount } from './helpers.js';

const router = express.Router();

router.post('/api/milestones/:id/submissions', (req, res) => {
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

router.get('/api/milestones/:id/submissions', (req, res) => {
  const milestone = getMilestone(req.params.id);
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

  const milestoneSubmissions = submissions.filter((submission) => submission.milestoneId === milestone.id);
  return res.json({ milestone, submissions: milestoneSubmissions });
});

router.get('/api/bounties/:id/submissions', (req, res) => {
  const bounty = getBounty(req.params.id);
  if (!bounty) return res.status(404).json({ error: 'Bounty not found' });

  const submissionsForBounty = bountySubmissions.filter((submission) => submission.bountyId === bounty.id);
  return res.json({ bounty, submissions: submissionsForBounty });
});

router.post('/api/milestones/:id/approve', (req, res) => {
  const milestone = getMilestone(req.params.id);
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
  updateMilestone(milestone.id, { status: 'approved' });

  const deal = getDeal(milestone.dealId);
  if (deal) {
    createCvEntry({
      userId: users[0].id,
      dealId: deal.id,
      milestoneId: milestone.id,
      title: milestone.title,
      amountSats: milestone.amountSats,
      amountLocal: estimateLocalAmount(milestone.amountSats, deal.localCurrency || 'KES'),
      localCurrency: deal.localCurrency || 'KES',
      preimage: createId('cv'),
      review: `Approved milestone ${milestone.id}`,
    });
  }

  return res.json({ milestone });
});

router.post('/api/milestones/:id/reject', (req, res) => {
  const milestone = getMilestone(req.params.id);
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
  updateMilestone(milestone.id, { status: 'rejected' });
  return res.json({ milestone });
});

router.post('/api/milestones/:id/bounty', (req, res) => {
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

router.get('/api/bounties', (_req, res) => {
  return res.json(bounties.filter((bounty) => bounty.status === 'open'));
});

router.get('/api/bounties/:id', (req, res) => {
  const bounty = getBounty(req.params.id);
  if (!bounty) return res.status(404).json({ error: 'Bounty not found' });
  return res.json(bounty);
});

router.post('/api/bounties/:id/submissions', (req, res) => {
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

router.post('/api/bounty-submissions/:id/accept', (req, res) => {
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

router.get('/api/live-cv/:userId', (req, res) => {
  const userId = req.params.userId;
  const user = users.find((u) => u.id === userId || u.slug === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user, entries: getCvForUser(user.id) });
});

router.get('/api/milestones/:id', (req, res) => {
  const milestone = getMilestone(req.params.id);
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
  return res.json(milestone);
});

export default router;
