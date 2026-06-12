'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

interface DealResponse {
  deal: {
    id: string;
    title: string;
    origin?: string;
    amountSats: number;
    status: string;
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

export default function FreelancerDashboard() {
  const params = useParams();
  const dealId = params.id as string;
  const [dealData, setDealData] = useState<DealResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submissions, setSubmissions] = useState<Array<{ id: string; milestoneId: string; previewUrl: string; notes?: string; status: string; createdAt: string; }>>([]);
  const [bounty, setBounty] = useState<any | null>(null);
  const [bountyPreviewUrl, setBountyPreviewUrl] = useState('');
  const [bountyNotes, setBountyNotes] = useState('');
  const [bountySubmissions, setBountySubmissions] = useState<any[]>([]);
  const [bountyMessage, setBountyMessage] = useState('');
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

  useEffect(() => {
    if (!dealId) return;
    setLoading(true);
    fetch(`${backendBase}/api/deals/${dealId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Deal not found');
        return res.json();
      })
      .then(async (payload: DealResponse) => {
        setDealData(payload);
        setError('');
        const nextMilestone = payload.milestones?.[0];
        if (nextMilestone) {
          fetch(`${backendBase}/api/milestones/${nextMilestone.id}/submissions`)
            .then((res) => res.ok ? res.json() : null)
            .then((body) => {
              if (body?.submissions) {
                setSubmissions(body.submissions);
              } else {
                setSubmissions([]);
              }
            })
            .catch(() => setSubmissions([]));

          // fetch bounty if opened
          try {
            const bRes = await fetch(`${backendBase}/api/bounties`);
            if (bRes.ok) {
              const bList = await bRes.json();
              const found = bList.find((b: any) => b.dealId === payload.deal.id && b.milestoneId === nextMilestone.id && b.status === 'open');
              if (found) {
                setBounty(found);
                const bsRes = await fetch(`${backendBase}/api/bounties/${found.id}/submissions`);
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
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load deal.');
      })
      .finally(() => setLoading(false));
  }, [dealId, backendBase]);

  // Poll the deal so milestone/payment changes show up without manual refresh
  useEffect(() => {
    if (!dealId) return;
    const iv = setInterval(() => {
      fetch(`${backendBase}/api/deals/${dealId}`)
        .then((res) => res.ok ? res.json() : null)
        .then((payload: DealResponse | null) => {
          if (!payload) return;
          setDealData(payload);
          const nextMilestone = payload.milestones?.[0];
          if (nextMilestone) {
            fetch(`${backendBase}/api/milestones/${nextMilestone.id}/submissions`)
              .then((res) => res.ok ? res.json() : null)
              .then((body) => {
                if (body?.submissions) setSubmissions(body.submissions);
                else setSubmissions([]);
              })
              .catch(() => setSubmissions([]));
          } else {
            setSubmissions([]);
          }
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(iv);
  }, [dealId, backendBase]);

  const handleSubmitBounty = async (bountyId: string) => {
    if (!bountyPreviewUrl.trim()) {
      setBountyMessage('Preview URL is required.');
      return;
    }
    setBountyMessage('Submitting...');
    try {
      const res = await fetch(`${backendBase}/api/bounties/${bountyId}/submissions`, {
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
      const bsRes = await fetch(`${backendBase}/api/bounties/${bountyId}/submissions`);
      if (bsRes.ok) {
        const bsBody = await bsRes.json();
        setBountySubmissions(bsBody.submissions || []);
      }
    } catch (err) {
      console.error(err);
      setBountyMessage((err as Error).message || 'Submission failed');
    }
  };

  const milestone = useMemo(() => dealData?.milestones?.[0] ?? null, [dealData]);
  const canSubmit = Boolean(milestone && milestone.status === 'funded');
  const submissionPending = Boolean(milestone && milestone.status === 'submitted');
  const approved = milestone?.status === 'approved' || milestone?.status === 'released';

  const handleSubmit = async () => {
    if (!milestone) return;
    if (!previewUrl.trim()) {
      setError('Please enter a deliverable URL.');
      return;
    }
    if (!previewUrl.trim().startsWith('https://')) {
      setError('URL must start with https://');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${backendBase}/api/milestones/${milestone.id}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewUrl: previewUrl.trim(), notes }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error || 'Submission failed');
      }
      await fetch(`${backendBase}/api/deals/${dealId}`)
        .then((res) => res.json())
        .then((payload: DealResponse) => setDealData(payload));
      setPreviewUrl('');
      setNotes('');
    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center text-zinc-500">
        Loading freelancer deal...
      </div>
    );
  }

  if (error && !dealData) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (!dealData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 py-12 px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-mono">
            Freelancer Workspace
          </div>
          <h1 className="text-2xl font-black tracking-tight">{dealData.deal.title}</h1>
          {dealData.deal.payInSats && (
            <p className="text-xs text-amber-400">Note: This deal is set to pay the freelancer in sats (no local conversion).</p>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">Deal origin</p>
              <p className="font-semibold mt-1">{dealData.deal.origin || 'Direct'}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-amber-500">{dealData.deal.amountSats.toLocaleString()} sats</p>
              <p className="text-xs text-zinc-500">Status: {dealData.deal.status}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-950">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Milestone</p>
            {milestone ? (
              <div className="mt-3 space-y-2">
                <p className="font-semibold">{milestone.title}</p>
                <p className="text-sm text-zinc-500">{milestone.amountSats.toLocaleString()} sats</p>
                <p className="text-xs uppercase tracking-wider text-zinc-500">Current status: {milestone.status}</p>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No milestones are attached to this deal yet.</p>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Submit Your Work</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Upload a deliverable preview URL once the milestone is funded.
            </p>
            {submissionPending && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-3">
                <div>A submission has already been sent and is awaiting client review.</div>
                {submissions.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-100 dark:bg-amber-950 p-3 text-sm text-amber-900 dark:text-amber-200">
                    <p className="font-semibold text-xs uppercase tracking-wider text-zinc-600">Latest submission</p>
                    <a href={submissions[0].previewUrl} target="_blank" rel="noreferrer" className="block text-blue-600 dark:text-blue-400 underline break-all mt-2">{submissions[0].previewUrl}</a>
                    <p className="text-xs text-zinc-500 mt-2">{submissions[0].notes || 'No notes provided.'}</p>
                  </div>
                )}
              </div>
            )}
            {approved && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                This milestone has already been approved.
              </div>
            )}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Deliverable URL</label>
              <input
                type="url"
                value={previewUrl}
                onChange={(e) => setPreviewUrl(e.target.value)}
                placeholder="https://your-project.vercel.app"
                disabled={!canSubmit || submitting || submissionPending || approved}
                className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm placeholder-zinc-400 focus:outline-none focus:border-amber-500 disabled:opacity-50"
              />
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={!canSubmit || submitting || submissionPending || approved}
                className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm placeholder-zinc-400 focus:outline-none focus:border-amber-500 disabled:opacity-50"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting || submissionPending || approved}
                className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold transition disabled:opacity-50"
              >
                {submitting
                  ? 'Submitting...'
                  : submissionPending
                  ? 'Submission Pending'
                  : approved
                  ? 'Milestone Approved'
                  : canSubmit
                  ? 'Submit Work'
                  : 'Waiting for Funding'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
