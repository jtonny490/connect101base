import express from 'express';
import {
  createDeal,
  createMilestone,
  createPayment,
  getDeal,
  getMilestone,
  getPayment,
  updateDeal,
  updateMilestone,
  updatePayment,
  milestones,
  payments,
  users,
} from './store.js';
import { createId } from './helpers.js';

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.post('/api/deals', (req, res) => {
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

router.get('/api/deals/:id', (req, res) => {
  const deal = getDeal(req.params.id);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });

  const dealMilestones = milestones.filter((milestone) => milestone.dealId === deal.id);
  const dealPayments = payments.filter((payment) => payment.dealId === deal.id);

  return res.json({ deal, milestones: dealMilestones, payments: dealPayments });
});

router.patch('/api/deals/:id', (req, res) => {
  const updated = updateDeal(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Deal not found' });
  return res.json(updated);
});

router.post('/api/deals/:id/invoice', (req, res) => {
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

router.get('/api/payments/:id/status', (req, res) => {
  const payment = getPayment(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  return res.json({ status: payment.status, payment });
});

router.post('/api/payments/:id/check', (req, res) => {
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

router.post('/api/payments/:id/release', (req, res) => {
  const payment = getPayment(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  const deal = getDeal(payment.dealId);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });

  updatePayment(payment.id, { status: 'released' });
  updateDeal(deal.id, { status: 'released' });
  return res.json({ status: 'released' });
});

router.post('/api/deals/:id/milestones', (req, res) => {
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

export default router;
