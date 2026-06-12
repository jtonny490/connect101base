'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface DealPayload {
  deal: {
    id: string;
    title: string;
    description?: string;
    origin?: string;
    amountSats: number;
    localCurrency?: string;
    status: string;
    clientToken: string;
    freelancerToken: string;
    createdAt: string;
    updatedAt: string;
  };
  milestones: Array<{
    id: string;
    title: string;
    amountSats: number;
    status: string;
    position: number;
  }>;
  payments: Array<{
    id: string;
    provider: string;
    status: string;
    invoice?: string;
    instructions?: string;
    amountSats: number;
    amountLocal: number;
    localCurrency: string;
  }>;
}

export default function ClientDealPage() {
  const params = useParams();
  const dealId = params.id as string;
  const [data, setData] = useState<DealPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [error, setError] = useState('');
  const [bountyOpen, setBountyOpen] = useState(false);
  const [bountyTitle, setBountyTitle] = useState('Fix milestone deliverable');
  const [bountyAmount, setBountyAmount] = useState('0');
  const [bountyDescription, setBountyDescription] = useState('Resolve issues from rejected milestone delivery.');
  const [submissions, setSubmissions] = useState<Array<{ id: string; milestoneId: string; previewUrl: string; notes?: string; status: string; createdAt: string; }>>([]);
  const [bounty, setBounty] = useState<any | null>(null);
  const [bountySubmissions, setBountySubmissions] = useState<any[]>([]);
  const [bountyPreviewUrl, setBountyPreviewUrl] = useState('');
  const [bountyNotes, setBountyNotes] = useState('');
  const [bountyLoading, setBountyLoading] = useState(false);
  const [bountyMessage, setBountyMessage] = useState('');
  const [sandboxUrl, setSandboxUrl] = useState<string | null>(null);
  const [backendUrl] = useState(
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
  );

  const refreshDeal = async () => {
    if (!dealId) return;
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/deals/${dealId}`);
      if (!res.ok) throw new Error('Deal not found');
      const payload: DealPayload = await res.json();
      setData(payload);
      setError('');
      if (payload.milestones.length > 0) {
        const firstMilestoneId = payload.milestones[0].id;
        const submissionsRes = await fetch(`${backendUrl}/api/milestones/${firstMilestoneId}/submissions`);
        if (submissionsRes.ok) {
          const submissionBody = await submissionsRes.json();
          setSubmissions(submissionBody.submissions || []);
        } else {
          setSubmissions([]);
        }
        // fetch any open bounty for this deal+milestone
        try {
          const bRes = await fetch(`${backendUrl}/api/bounties`);
          if (bRes.ok) {
            const bList = await bRes.json();
            const found = bList.find((b: any) => b.dealId === payload.deal.id && b.milestoneId === firstMilestoneId && b.status === 'open');
            if (found) {
              setBounty(found);
              const bsRes = await fetch(`${backendUrl}/api/bounties/${found.id}/submissions`);
              if (bsRes.ok) {
                const bsBody = await bsRes.json();
                setBountySubmissions(bsBody.submissions || []);
              } else {
                setBountySubmissions([]);
              }
            } else {
              setBounty(null);
              setBountySubmissions([]);
            }
          }
        } catch (err) {
          setBounty(null);
          setBountySubmissions([]);
        }
      } else {
        setSubmissions([]);
        setBounty(null);
        setBountySubmissions([]);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load deal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDeal();
  }, [dealId, backendUrl]);

  // Poll the deal occasionally so changes (funding, submissions) appear without refresh
  useEffect(() => {
    if (!dealId) return;
    const iv = setInterval(() => {
      refreshDeal();
    }, 5000);
    return () => clearInterval(iv);
  }, [dealId, backendUrl]);

  const handleCheckPayment = async () => {
    if (!latestPayment) return;
    setPaymentLoading(true);
    setPaymentMessage('Checking payment...');

    try {
      const response = await fetch(`${backendUrl}/api/payments/${latestPayment.id}/check`, {
        method: 'POST',
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error || 'Payment verification failed');
      }
      const result = await response.json();
      setPaymentMessage(`Payment status: ${result.status}`);
      await refreshDeal();
    } catch (err) {
      console.error(err);
      setPaymentMessage((err as Error).message || 'Unable to verify payment.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleAction = async (path: string, successMessage: string) => {
    if (!data) return;
    setActionLoading(true);
    setActionMessage('Processing…');
    try {
      const response = await fetch(`${backendUrl}${path}`, { method: 'POST' });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error || 'Action failed');
      }
      setActionMessage(successMessage);
      await refreshDeal();
    } catch (err) {
      console.error(err);
      setActionMessage((err as Error).message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveMilestone = async (milestoneId: string) => {
    await handleAction(`/api/milestones/${milestoneId}/approve`, 'Milestone approved.');
  };

  const handleRejectMilestone = async (milestoneId: string) => {
    await handleAction(`/api/milestones/${milestoneId}/reject`, 'Milestone rejected. You can open a bounty from this milestone.');
  };

  const handleReleaseFunds = async () => {
    if (!latestPayment) return;
    await handleAction(`/api/payments/${latestPayment.id}/release`, 'Funds released.');
  };

  const handleOpenBounty = async (milestoneId: string) => {
    if (!data) return;
    if (!bountyTitle.trim()) {
      setActionMessage('Bounty title is required.');
      return;
    }
    if (!Number(bountyAmount) || Number(bountyAmount) <= 0) {
      setActionMessage('Enter a valid bounty amount.');
      return;
    }
    setActionLoading(true);
    setActionMessage('Opening bounty…');

    try {
      const response = await fetch(`${backendUrl}/api/milestones/${milestoneId}/bounty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bountyTitle.trim(),
          description: bountyDescription.trim(),
          amountSats: Number(bountyAmount),
        }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error || 'Unable to open bounty');
      }
      setActionMessage('Bounty opened successfully.');
      await refreshDeal();
      setBountyOpen(false);
    } catch (err) {
      console.error(err);
      setActionMessage((err as Error).message || 'Unable to open bounty.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitBounty = async (bountyId: string) => {
    if (!bountyPreviewUrl.trim()) {
      setBountyMessage('Preview URL is required.');
      return;
    }
    setBountyLoading(true);
    setBountyMessage('Submitting…');
    try {
      const res = await fetch(`${backendUrl}/api/bounties/${bountyId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewUrl: bountyPreviewUrl.trim(), notes: bountyNotes.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error || 'Submission failed');
      }
      setBountyPreviewUrl('');
      setBountyNotes('');
      setBountyMessage('Submission sent.');
      // refresh submissions
      const bsRes = await fetch(`${backendUrl}/api/bounties/${bountyId}/submissions`);
      if (bsRes.ok) {
        const bsBody = await bsRes.json();
        setBountySubmissions(bsBody.submissions || []);
      }
    } catch (err) {
      console.error(err);
      setBountyMessage((err as Error).message || 'Submission failed');
    } finally {
      setBountyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center text-zinc-500">
        Loading deal...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center text-red-500">
        {error || 'Deal not available.'}
      </div>
    );
  }

  const latestPayment = data.payments[data.payments.length - 1];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase text-zinc-500 tracking-wider">Client Escrow Page</p>
              <h1 className="text-3xl font-black mt-2">{data.deal.title}</h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Origin: {data.deal.origin || 'Direct'}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-amber-500">{data.deal.amountSats.toLocaleString()} sats</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Status: {data.deal.status}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-900">
              <p className="text-xs uppercase text-zinc-500 tracking-wider">Payment Request</p>
              {latestPayment?.invoice ? (
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 break-all">{latestPayment.invoice}</p>
              ) : latestPayment?.instructions ? (
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 break-all">{latestPayment.instructions}</p>
              ) : (
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">No invoice created yet.</p>
              )}
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                Provider: {latestPayment?.provider || '–'} • Payment status: {latestPayment?.status || '–'}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-900">
              <p className="text-xs uppercase text-zinc-500 tracking-wider">Actions</p>
              <div className="mt-4 space-y-3">
                <button
                  onClick={handleCheckPayment}
                  disabled={paymentLoading || !latestPayment}
                  className="w-full rounded-xl bg-blue-500 hover:bg-blue-400 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {paymentLoading ? 'Checking payment…' : 'Check payment status'}
                </button>
                {paymentMessage && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{paymentMessage}</p>
                )}

                {latestPayment?.status === 'paid' && (
                  <button
                    onClick={handleReleaseFunds}
                    disabled={actionLoading}
                    className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {actionLoading ? 'Releasing funds…' : 'Release escrow funds'}
                  </button>
                )}

                {actionMessage && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{actionMessage}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">Milestones</h2>
            <div className="space-y-3">
              {data.milestones.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No milestones added yet.</p>
              ) : (
                data.milestones.map((milestone) => {
                  const milestoneSubmissions = submissions.filter((submission) => submission.milestoneId === milestone.id);
                  const latestSubmission = milestoneSubmissions[0] ?? null;
                  const canApprove = milestone.status === 'submitted';
                  const canReject = milestone.status === 'submitted';
                  const canOpenBounty = milestone.status === 'rejected' || milestone.status === 'disputed';
                  return (
                    <div key={milestone.id} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{milestone.title}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">Position #{milestone.position}</p>
                        </div>
                        <span className="text-xs uppercase tracking-wider text-zinc-500">{milestone.status}</span>
                      </div>
                      <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{milestone.amountSats.toLocaleString()} sats</p>

                      {milestone.status === 'submitted' && latestSubmission && (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                          <p className="font-semibold">Submission ready for review</p>
                          <div className="mt-3 space-y-2">
                            <p className="text-xs text-zinc-600">Deliverable URL</p>
                            <a href={latestSubmission.previewUrl} target="_blank" rel="noreferrer" className="block text-blue-600 dark:text-blue-400 underline break-all">{latestSubmission.previewUrl}</a>
                            <p className="text-xs text-zinc-600">Notes</p>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{latestSubmission.notes || 'No additional notes.'}</p>
                            <button
                              onClick={() => setSandboxUrl(sandboxUrl === latestSubmission.previewUrl ? null : latestSubmission.previewUrl)}
                              className="w-full rounded-xl bg-violet-500 hover:bg-violet-400 py-3 text-sm font-bold text-white"
                            >
                              {sandboxUrl === latestSubmission.previewUrl ? '✕ Close Sandbox' : '🔬 Open in Sandbox'}
                            </button>
                          </div>
                        </div>
                      )}

                      {sandboxUrl && milestone.status === 'submitted' && (
                        <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold">🔬 Sandbox — Testing Freelancer Deliverable</p>
                            <button onClick={() => setSandboxUrl(null)} className="text-white text-xs underline">Close</button>
                          </div>
                          <div className="w-full h-[400px] rounded-xl overflow-hidden border">
                            <iframe src={sandboxUrl} className="w-full h-full" />
                          </div>
                        </div>
                      )}

                      {(canApprove || canReject) && (
                        <div className="mt-4 flex flex-col gap-3">
                          <button
                            onClick={() => handleApproveMilestone(milestone.id)}
                            disabled={actionLoading}
                            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-white disabled:opacity-50"
                          >
                            Approve milestone
                          </button>
                          <button
                            onClick={() => handleRejectMilestone(milestone.id)}
                            disabled={actionLoading}
                            className="w-full rounded-xl border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 py-3 text-sm font-semibold disabled:opacity-50"
                          >
                            Reject milestone
                          </button>
                        </div>
                      )}

                      {canOpenBounty && (
                        <div className="mt-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">Open a bounty for this milestone</p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">Reassign unresolved work to a bounty task.</p>
                            </div>
                            <button
                              onClick={() => setBountyOpen(!bountyOpen)}
                              className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-xs font-semibold"
                            >
                              {bountyOpen ? 'Cancel' : 'Open bounty'}
                            </button>
                          </div>
                          {bountyOpen && (
                            <div className="mt-4 space-y-3">
                              <label className="block text-xs font-semibold uppercase text-zinc-500">Bounty title</label>
                              <input
                                value={bountyTitle}
                                onChange={(e) => setBountyTitle(e.target.value)}
                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 px-4 py-3 text-sm"
                              />
                              <label className="block text-xs font-semibold uppercase text-zinc-500">Amount (Sats)</label>
                              <input
                                type="number"
                                value={bountyAmount}
                                onChange={(e) => setBountyAmount(e.target.value)}
                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 px-4 py-3 text-sm"
                              />
                              <label className="block text-xs font-semibold uppercase text-zinc-500">Description</label>
                              <textarea
                                value={bountyDescription}
                                onChange={(e) => setBountyDescription(e.target.value)}
                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 px-4 py-3 text-sm"
                                rows={3}
                              />
                              <button
                                onClick={() => handleOpenBounty(milestone.id)}
                                disabled={actionLoading}
                                className="w-full rounded-xl bg-blue-500 hover:bg-blue-400 py-3 text-sm font-bold text-white disabled:opacity-50"
                              >
                                {actionLoading ? 'Opening bounty…' : 'Create bounty'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bounty panel (if a bounty is open for this milestone) */}
                      {bounty && (
                        <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                          <p className="font-semibold">Open Bounty: {bounty.title}</p>
                          <p className="text-xs text-zinc-500">{bounty.description}</p>
                          <p className="text-sm mt-2">Amount: {bounty.amountSats.toLocaleString()} sats</p>

                          <div className="mt-3">
                            <p className="text-xs font-semibold">Submit a solution</p>
                            <input value={bountyPreviewUrl} onChange={(e) => setBountyPreviewUrl(e.target.value)} placeholder="https://your-fix.example" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm mt-2" />
                            <textarea value={bountyNotes} onChange={(e) => setBountyNotes(e.target.value)} rows={3} placeholder="Notes" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm mt-2" />
                            {bountyMessage && <p className="text-xs text-zinc-500 mt-2">{bountyMessage}</p>}
                            <button onClick={() => handleSubmitBounty(bounty.id)} disabled={bountyLoading} className="w-full mt-2 py-3 bg-violet-500 text-white rounded-xl">{bountyLoading ? 'Submitting…' : 'Submit bounty solution'}</button>
                          </div>

                          {bountySubmissions.length > 0 && (
                            <div className="mt-4">
                              <p className="text-xs font-semibold">Submissions</p>
                              {bountySubmissions.map((s) => (
                                <div key={s.id} className="mt-2 p-2 border rounded">
                                  <a href={s.previewUrl} target="_blank" rel="noreferrer" className="text-blue-600">{s.previewUrl}</a>
                                  <p className="text-xs">{s.notes}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
