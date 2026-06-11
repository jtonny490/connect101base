'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export default function CreateDeal() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [origin, setOrigin] = useState('Direct');

  const [preimage, setPreimage] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [clientLink, setClientLink] = useState('');
  const [freelancerLink, setFreelancerLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleCreate = async () => {
    if (loading) return;
    if (!title || !amount) return;
    setLoading(true);

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/create-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, memo: title }),
      });

      const data = await response.json();
      if (data.payment_request) {
        const p = data.preimage;
        const t = String(data.timestamp);
        setPreimage(p);
        setTimestamp(t);

        const origin2 = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

        const cLink = `${origin2}/live-cv/juma-codes?deal=active`
          + `&invoice=${encodeURIComponent(data.payment_request)}`
          + `&title=${encodeURIComponent(title)}`
          + `&amount=${encodeURIComponent(amount)}`
          + `&preimage=${encodeURIComponent(p)}`
          + `&timestamp=${encodeURIComponent(t)}`;

        const fLink = `${origin2}/freelancer/${p}`;

        setClientLink(cLink);
        setFreelancerLink(fLink);

        // Save deal to localStorage so freelancer page can read it
        const deal = { title, amount, origin, preimage: p, timestamp: t, status: 'awaiting_payment' };
        localStorage.setItem(`deal_${p}`, JSON.stringify(deal));

        setDone(true);
      }
    } catch (err) {
      console.error('Error connecting to Bitcoin backend', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 py-12 px-6 flex justify-center items-center">
      <div className="max-w-xl w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold mb-2">Create Deal Lockbox</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">Generate a client funding link and a freelancer deal link for this escrow.</p>

        {!done ? (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Platform Origin</label>
              <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500">
                <option value="Direct">Direct (WhatsApp / X / Telegram)</option>
                <option value="Fiverr">Fiverr Chat</option>
                <option value="Upwork">Upwork Messages</option>
                <option value="LinkedIn">LinkedIn DM</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Deal Title / Scope of Work</label>
              <input
                type="text"
                placeholder="e.g., E-Commerce Figma UI Design"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm placeholder-zinc-400 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Escrow Amount (Sats)</label>
              <input
                type="number"
                placeholder="e.g., 25000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm placeholder-zinc-400 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Connecting to Bitcoin Network...' : 'Generate TrustLink'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl font-medium text-sm text-center">
              🎉 Deal Lockbox Created!
            </div>

            {/* Client link */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Client Funding Link</p>
              <input type="text" readOnly value={clientLink} className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-amber-600 dark:text-amber-400 font-mono text-xs focus:outline-none" />
	              <button
	                type="button"
	                onClick={() => copyText(clientLink)}
	                className="w-full py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-sm font-medium rounded-xl transition"
	              >
                Copy Client Link
              </button>
            </div>

            {/* Freelancer link */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Freelancer Deal Link</p>
              <input type="text" readOnly value={freelancerLink} className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-blue-600 dark:text-blue-400 font-mono text-xs focus:outline-none" />
	              <button
	                type="button"
	                onClick={() => copyText(freelancerLink)}
	                className="w-full py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-sm font-medium rounded-xl transition"
	              >
                Copy Freelancer Deal Link
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 py-3 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-medium rounded-xl text-sm transition"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => router.push(`/freelancer/${preimage}`)}
                className="flex-1 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl text-sm transition"
              >
                Go to Freelancer View
              </button>
              <button
                type="button"
                onClick={() => router.push(`/live-cv/juma-codes?deal=active&invoice=&title=${encodeURIComponent(title)}&amount=${encodeURIComponent(amount)}&preimage=${encodeURIComponent(preimage)}&timestamp=${encodeURIComponent(timestamp)}`)}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-sm transition"
              >
                Client View
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
