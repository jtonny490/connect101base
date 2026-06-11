'use client';
import { useState, useSyncExternalStore } from 'react';
import { useParams } from 'next/navigation';

interface Deal {
  title: string;
  amount: string;
  origin: string;
  preimage: string;
  timestamp: string;
  status: string;
  deliverableUrl?: string;
}

const dealCache = new Map<string, { raw: string; value: Deal | null }>();

function loadDeal(dealId: string): Deal | null {
  if (typeof window === 'undefined') return null;

  const saved = localStorage.getItem(`deal_${dealId}`);
  if (!saved) return null;

  const cached = dealCache.get(dealId);
  if (cached?.raw === saved) return cached.value;

  try {
    const parsed = JSON.parse(saved) as Deal;
    dealCache.set(dealId, { raw: saved, value: parsed });
    return parsed;
  } catch {
    dealCache.set(dealId, { raw: saved, value: null });
    return null;
  }
}

function subscribeToDealUpdates(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('deallock-storage', callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('deallock-storage', callback);
  };
}

function saveDeal(dealId: string, deal: Deal) {
  localStorage.setItem(`deal_${dealId}`, JSON.stringify(deal));
  window.dispatchEvent(new Event('deallock-storage'));
}

export default function FreelancerDashboard() {
  const params = useParams();
  const dealId = params.id as string;
  const storedDeal = useSyncExternalStore(
    subscribeToDealUpdates,
    () => loadDeal(dealId),
    () => null
  );

  const [localDeal, setLocalDeal] = useState<Deal | null>(null);
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [editingSubmission, setEditingSubmission] = useState(false);
  const deal = localDeal || storedDeal;
  const submitted = Boolean(deal?.deliverableUrl) && !editingSubmission;
  const visibleDeliverableUrl = editingSubmission
    ? deliverableUrl
    : deliverableUrl || deal?.deliverableUrl || '';

  const handleSubmit = () => {
    if (!deal) return;
    const nextDeliverableUrl = visibleDeliverableUrl.trim();
    if (!nextDeliverableUrl) {
      setUrlError('Please enter a deliverable URL.');
      return;
    }
    if (!nextDeliverableUrl.startsWith('https://')) {
      setUrlError('URL must start with https://');
      return;
    }
    setUrlError('');
    const updated: Deal = { ...deal, deliverableUrl: nextDeliverableUrl, status: 'work_submitted' };
    saveDeal(dealId, updated);
    setLocalDeal(updated);
    setEditingSubmission(false);
  };

  const handleResubmit = () => {
    setDeliverableUrl(deal?.deliverableUrl || '');
    setEditingSubmission(true);
    setUrlError('');
  };

  if (!deal) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-zinc-500 text-sm">Deal not found.</p>
          <p className="text-zinc-400 text-xs font-mono">ID: {dealId?.substring(0, 20)}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 py-12 px-6">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-mono">
            Freelancer Dashboard
          </div>
          <h1 className="text-2xl font-black tracking-tight">Your Active Deal</h1>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold">{deal.title}</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Platform: {deal.origin}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-amber-500">{parseInt(deal.amount).toLocaleString()}</p>
              <p className="text-xs text-zinc-400">Sats in escrow</p>
            </div>
          </div>
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-[11px] font-mono text-zinc-400">
              Deal ID: SIG_0x{deal.preimage.substring(0, 24)}...
            </p>
          </div>
        </div>

        <div className={`rounded-xl px-5 py-3 text-sm font-medium border ${
          deal.status === 'work_submitted'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
        }`}>
          {deal.status === 'awaiting_payment' && 'Awaiting client payment — share the client link'}
          {deal.status === 'work_submitted' && 'Work submitted — client is reviewing your deliverable'}
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <div>
            <h3 className="font-bold text-lg mb-1">Submit Your Deliverable</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Deploy your work and paste the preview URL. The client reviews it in a sandbox and cannot download your files.
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Deliverable URL
            </label>
              <input
                type="url"
                placeholder="https://your-project.vercel.app"
                value={visibleDeliverableUrl}
                onChange={(e) => setDeliverableUrl(e.target.value)}
                disabled={submitted}
              className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm placeholder-zinc-400 focus:outline-none focus:border-amber-500 disabled:opacity-50"
            />
            <p className="text-[11px] text-zinc-400">
              Works with: Vercel, Netlify, Figma view-only, Framer, Google Docs view-only, Vimeo, YouTube unlisted
            </p>
            {urlError && <p className="text-xs text-red-500">{urlError}</p>}
          </div>

          {!submitted ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition"
            >
              Submit Work for Review
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-medium text-center">
                Deliverable submitted — waiting for client approval
              </div>
              <button
                type="button"
                onClick={handleResubmit}
                className="w-full py-2.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-sm font-medium rounded-xl transition"
              >
                Update Deliverable URL
              </button>
            </div>
          )}
        </div>

        {submitted && visibleDeliverableUrl && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Deliverable Preview</p>
              <a
                href={visibleDeliverableUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:text-blue-400 font-medium"
              >
                Open preview
              </a>
            </div>
            <iframe
              src={visibleDeliverableUrl}
              sandbox="allow-scripts allow-same-origin allow-forms"
              className="w-full h-[500px] border-0"
              title="Deliverable Preview"
            />
          </div>
        )}

      </div>
    </div>
  );
}
