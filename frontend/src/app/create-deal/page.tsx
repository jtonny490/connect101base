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
  const [provider, setProvider] = useState('lightning');
  const [currency, setCurrency] = useState('KES');

  const [paymentRequest, setPaymentRequest] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [dealId, setDealId] = useState('');
  const [clientLink, setClientLink] = useState('');
  const [freelancerLink, setFreelancerLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleCreate = async () => {
    if (loading) return;
    if (!title || !amount) return;
    setLoading(true);

    try {
      const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL ||
        (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000');

      const dealResponse = await fetch(`${backendBase}/api/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, origin, amountSats: Number(amount), description: '' }),
      });

      const deal = await dealResponse.json();
      if (!deal?.id) throw new Error('Failed to create deal');

      const invoiceResponse = await fetch(`${backendBase}/api/deals/${deal.id}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, currency }),
      });

      const invoice = await invoiceResponse.json();

      if (!invoice?.id) throw new Error('Failed to generate invoice');
      if (invoice?.invoice) {
        setPaymentRequest(invoice.invoice);
      }
      if (invoice?.instructions) {
        setPaymentInstructions(invoice.instructions);
      }

      const originUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const clientUrl = `${originUrl}/client/deals/${deal.id}`;
      const freelancerUrl = `${originUrl}/freelancer/${deal.id}`;

      setPaymentRequest(invoice.invoice || '');
      setPaymentId(invoice.id);
      setDealId(deal.id);
      setClientLink(clientUrl);
      setFreelancerLink(freelancerUrl);
      setDone(true);

    } catch (err) {
      console.error('Error connecting to backend', err);
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Payment Provider</label>
                <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500">
                  <option value="lightning">Lightning</option>
                  <option value="mpesa">M-Pesa</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Local Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500">
                  <option value="KES">KES</option>
                  <option value="UGX">UGX</option>
                  <option value="NGN">NGN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
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
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-sm">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Payment details</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Provider: {provider.toUpperCase()} • Currency: {currency}</p>
              {paymentRequest && (
                <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 break-all">
                  <p className="font-semibold">Invoice</p>
                  <p>{paymentRequest}</p>
                </div>
              )}
              {paymentInstructions && (
                <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 break-all">
                  <p className="font-semibold">Instructions</p>
                  <p>{paymentInstructions}</p>
                </div>
              )}
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
                onClick={() => router.push(`/freelancer/${dealId}`)}
                className="flex-1 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl text-sm transition"
              >
                Go to Freelancer View
              </button>
              <button
                type="button"
                onClick={() => router.push(`/client/deals/${dealId}`)}
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
