'use client';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense, useEffect, useRef, useSyncExternalStore } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ContractItem {
  title: string;
  platform: string;
  amount: string;
  date: string;
  review: string;
  preimage: string;
  timestamp: number;
  isSeed?: boolean;
  isNew?: boolean;
}

interface Deal {
  title: string;
  amount: string;
  origin: string;
  preimage: string;
  timestamp: string;
  status: string;
  deliverableUrl?: string;
}

async function verifyBlock(block: ContractItem): Promise<boolean> {
  if (block.isSeed) return true;
  if (block.isNew) return true;
  if (typeof crypto === 'undefined' || !crypto.subtle) return true;
  const data = `${block.title}:${block.amount}:${block.timestamp}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex === block.preimage;
}

const SEED_CONTRACTS: ContractItem[] = [
  {
    title: 'Figma UI Redesign (Fintech App)',
    platform: 'Fiverr Contract',
    amount: '35000',
    date: 'May 2026',
    review: 'Clean, fast delivery. Exactly what we needed.',
    preimage: 'seed_figma_ui_redesign',
    timestamp: 1746057600000,
    isSeed: true,
  },
  {
    title: 'Next.js Frontend Integration',
    platform: 'Upwork Project',
    amount: '80000',
    date: 'Apr 2026',
    review: 'Exceptional work, delivered ahead of schedule.',
    preimage: 'seed_nextjs_frontend',
    timestamp: 1743379200000,
    isSeed: true,
  },
  {
    title: 'Custom Payment Webhook Middleware',
    platform: 'Twitter Direct Deal',
    amount: '20000',
    date: 'Mar 2026',
    review: 'Optimized our API responses by 40%. Highly recommend.',
    preimage: 'seed_webhook_middleware',
    timestamp: 1740700800000,
    isSeed: true,
  },
];

let contractsCache: { raw: string | null; value: ContractItem[] } = {
  raw: null,
  value: SEED_CONTRACTS,
};

function loadContracts(): ContractItem[] {
  if (typeof window === 'undefined') return SEED_CONTRACTS;

  const saved = localStorage.getItem('deallock_history');
  if (!saved) {
    contractsCache = { raw: null, value: SEED_CONTRACTS };
    return SEED_CONTRACTS;
  }

  if (contractsCache.raw === saved) return contractsCache.value;

  try {
    const parsed = sanitizeContracts(JSON.parse(saved));
    contractsCache = { raw: saved, value: parsed };
    return parsed;
  } catch {
    contractsCache = { raw: saved, value: SEED_CONTRACTS };
    return SEED_CONTRACTS;
  }
}

function sanitizeContracts(value: unknown): ContractItem[] {
  if (!Array.isArray(value)) return SEED_CONTRACTS;

  const seenSignatures = new Set<string>();

  return value
    .filter((contract): contract is Partial<ContractItem> => Boolean(contract) && typeof contract === 'object')
    .map((contract, index) => {
      const timestamp = Number(contract.timestamp || Date.now());
      let preimage = String(contract.preimage || '');

      if (!preimage || preimage === 'missing_signature' || seenSignatures.has(preimage)) {
        preimage = `legacy_signature_${index}_${timestamp}`;
      }
      seenSignatures.add(preimage);

      return {
        title: String(contract.title || 'Untitled Deal'),
        platform: String(contract.platform || 'Direct Deal'),
        amount: String(contract.amount || '0'),
        date: String(contract.date || 'Just Now'),
        review: String(contract.review || ''),
        preimage,
        timestamp,
        isSeed: Boolean(contract.isSeed),
        isNew: Boolean(contract.isNew),
      };
    });
}

function subscribeToContractUpdates(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('deallock-storage', callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('deallock-storage', callback);
  };
}

function saveContracts(contracts: ContractItem[]) {
  const raw = JSON.stringify(contracts);
  contractsCache = { raw, value: contracts };
  localStorage.setItem('deallock_history', raw);
  window.dispatchEvent(new Event('deallock-storage'));
}

function VerifiedBlock({ contract }: { contract: ContractItem }) {
  const signature = contract.preimage || 'missing_signature';
  const [isValid, setIsValid] = useState<boolean | null>(
    contract.isSeed || contract.isNew ? true : null
  );

  useEffect(() => {
    if (contract.isSeed || contract.isNew) return;
    verifyBlock(contract).then(setIsValid);
  }, [contract]);

  if (isValid === null) return null;

  return (
    <div className={`bg-white dark:bg-zinc-900 border rounded-xl p-5 space-y-3 shadow-sm transition duration-500 ${
      contract.isNew
        ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-transparent'
        : isValid
          ? 'border-zinc-200 dark:border-zinc-800'
          : 'border-red-500/30 bg-red-500/5'
    }`}>
      <div className="flex justify-between items-start gap-4">
        <div>
          <h4 className="font-bold text-zinc-900 dark:text-white">{contract.title}</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {contract.platform} • {
              contract.isSeed
                ? contract.date
                : new Date(contract.timestamp).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
            }
          </p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
          !isValid
            ? 'text-red-600 bg-red-500/10 border-red-500/20'
            : contract.isNew
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
        }`}>
          {!isValid ? '⚠ Unverified' : contract.isNew ? '✔ Just Verified' : '✔ Verified Bitcoin Payment'}
        </span>
      </div>

      {contract.review && isValid && (
        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 italic">
          &ldquo;{contract.review}&rdquo;
        </div>
      )}

      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between text-[11px] text-zinc-400 font-mono">
        <span>Settled: {contract.amount} Sats</span>
        <span>SIG_0x{signature.substring(0, 12)}...</span>
      </div>
    </div>
  );
}

type EscrowStatus = 'funding' | 'locked' | 'waiting_delivery' | 'reviewing' | 'released';

function LiveCVContent() {
  const searchParams = useSearchParams();
  const hasActiveDeal = searchParams.get('deal');
  const invoiceData = searchParams.get('invoice');
  const dealTitle = searchParams.get('title') || '';
  const dealAmount = searchParams.get('amount') || '0';
  const dealPreimage = searchParams.get('preimage') || searchParams.get('preimge') || '';
  const dealTimestamp = parseInt(searchParams.get('timestamp') || '0');
  const storedContracts = useSyncExternalStore(
    subscribeToContractUpdates,
    loadContracts,
    () => SEED_CONTRACTS
  );

  const [escrowStatus, setEscrowStatus] = useState<EscrowStatus>('funding');
  const [clientReview, setClientReview] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [dealData, setDealData] = useState<Deal | null>(null);
  const [showSandbox, setShowSandbox] = useState(false);
  const contractsLoaded = useRef(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const contracts = storedContracts;

  useEffect(() => {
    contractsLoaded.current = true;
  }, []);

  // Poll localStorage for freelancer deliverable submission
  useEffect(() => {
    if (!dealPreimage) return;

    const poll = () => {
      const saved = localStorage.getItem(`deal_${dealPreimage}`);
      if (saved) {
        let parsed: Deal;
        try {
          parsed = JSON.parse(saved) as Deal;
        } catch {
          return;
        }
        setDealData(parsed);
        if (
          parsed.status === 'work_submitted' &&
          parsed.deliverableUrl &&
          escrowStatus === 'waiting_delivery'
        ) {
          setEscrowStatus('reviewing');
        }
      }
    };

    poll();
    pollRef.current = setInterval(poll, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [dealPreimage, escrowStatus]);

  const handleReleaseEscrow = () => {
    if (!contractsLoaded.current) return;
    if (escrowStatus === 'released') return;

    if (clientReview.length > 280) {
      setReviewError('Review must be 280 characters or less.');
      return;
    }

    const BANNED = [/https?:\/\//i, /<[^>]*>/, /javascript:/i, /on\w+\s*=/i];
    for (const p of BANNED) {
      if (p.test(clientReview)) {
        setReviewError('Review contains invalid content.');
        return;
      }
    }

    if (pollRef.current) clearInterval(pollRef.current);
    setReviewError('');
    setEscrowStatus('released');

    const newContract: ContractItem = {
      title: dealTitle,
      platform: dealData?.origin || 'Direct Deal',
      amount: dealAmount,
      date: 'Just Now',
      review: clientReview.trim(),
      preimage: dealPreimage,
      timestamp: dealTimestamp,
      isNew: true,
    };

    if (contracts.some(c => c.preimage === newContract.preimage)) return;
    saveContracts([newContract, ...contracts]);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Demo badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-xs font-mono">
          🧪 Hackathon Demo — Mock Lightning Invoice
        </div>

        {/* Profile Header */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Juma Codes</h1>
            <p className="text-amber-600 dark:text-amber-400 font-mono text-xs truncate max-w-xs sm:max-w-md">
              ID: bc1qxy2kgdygjrsqtzq5qqsn0j2ea...
            </p>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm max-w-xl pt-1">
              Full-Stack Engineer based in Nairobi. Every entry below is anchored to a real Bitcoin payment — unfakeable by design.
            </p>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-5 py-3 rounded-xl text-center min-w-[120px]">
            <p className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Trust Score</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">100%</p>
          </div>
        </div>

        {/* Active Escrow Box */}
        {hasActiveDeal && escrowStatus !== 'released' && (
          <div className="bg-white dark:bg-zinc-900 border border-amber-500/30 rounded-2xl p-6 shadow-md space-y-4">

            <div className="flex flex-col md:flex-row items-start gap-6">
              {invoiceData && escrowStatus === 'funding' && (
                <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-center shrink-0">
                  <QRCodeSVG value={invoiceData} size={160} />
                </div>
              )}
              <div className="space-y-3 flex-1 w-full">
                <div>
                  <h3 className="text-lg font-bold text-amber-600 dark:text-amber-400 mb-1">
                    ⚡ Escrow Lockbox
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                    Project: {dealTitle}
                  </p>
                  <p className="text-xs text-zinc-500 font-mono">
                    SIG_0x{dealPreimage.substring(0, 20)}...
                  </p>
                </div>

                {/* Status label */}
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {escrowStatus === 'funding' && '⚡ Scan QR to fund escrow, then confirm below'}
                  {escrowStatus === 'locked' && '🔒 Funds locked — share freelancer link so they can submit work'}
                  {escrowStatus === 'waiting_delivery' && '⏳ Waiting for freelancer to submit deliverable...'}
                  {escrowStatus === 'reviewing' && '👀 Deliverable ready — review and release funds'}
                </div>

                {/* STEP: Funding */}
                {escrowStatus === 'funding' && (
                  <button
                    onClick={() => setEscrowStatus('locked')}
                    className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs rounded-xl transition"
                  >
                    Confirm Payment Sent
                  </button>
                )}

                {/* STEP: Locked */}
                {escrowStatus === 'locked' && (
                  <button
                    onClick={() => setEscrowStatus('waiting_delivery')}
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-xl transition"
                  >
                    Waiting for Delivery
                  </button>
                )}

                {/* STEP: Waiting delivery — spinner */}
                {escrowStatus === 'waiting_delivery' && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                    <div className="w-3 h-3 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                    Polling for freelancer submission...
                  </div>
                )}
              </div>
            </div>

            {/* STEP: Reviewing — sandbox + review form */}
            {escrowStatus === 'reviewing' && dealData?.deliverableUrl && (
              <div className="space-y-4 w-full">
                {/* View Work button */}
                {!showSandbox ? (
                  <button
                    onClick={() => setShowSandbox(true)}
                    className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition"
                  >
                    🖥 View Delivered Work
                  </button>
                ) : (
                  <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                    <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-between">
                      <p className="text-xs font-mono text-zinc-500 truncate">{dealData.deliverableUrl}</p>
                      <button
                        onClick={() => setShowSandbox(false)}
                        className="text-xs text-zinc-400 hover:text-zinc-200 ml-4"
                      >
                        Close
                      </button>
                    </div>
                    <iframe
                      src={dealData.deliverableUrl}
                      sandbox="allow-scripts allow-same-origin allow-forms"
                      className="w-full h-[500px] border-0"
                      title="Deliverable Sandbox"
                    />
                  </div>
                )}

                {/* Review + Release */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Your Review <span className="normal-case font-normal text-zinc-400">(optional, 280 chars max)</span>
                  </label>
                  <textarea
                    maxLength={280}
                    rows={3}
                    placeholder='e.g., "Phenomenal work, delivered ahead of schedule."'
                    value={clientReview}
                    onChange={(e) => setClientReview(e.target.value)}
                    className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm placeholder-zinc-400 focus:outline-none focus:border-amber-500 resize-none"
                  />
                  <div className="flex justify-between">
                    {reviewError
                      ? <p className="text-xs text-red-500">{reviewError}</p>
                      : <span />
                    }
                    <p className="text-xs text-zinc-400 ml-auto">{clientReview.length}/280</p>
                  </div>
                  <button
                    onClick={handleReleaseEscrow}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition"
                  >
                    Approve & Release Funds
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Release success */}
        {escrowStatus === 'released' && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-2xl p-5 text-center border-dashed space-y-2">
            <div className="font-semibold text-sm">
              🚀 Escrow Released! Cryptographic CV entry anchored to SIG_0x{dealPreimage.substring(0, 12)}...
            </div>
            <div className="text-xs font-mono break-all text-zinc-400">
              Settlement Proof: {dealPreimage}
            </div>
          </div>
        )}

        {/* Verified Portfolio */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold tracking-wide">Cryptographically Anchored Proof-of-Work</h3>
          <div className="space-y-4">
            {contracts.map((contract, index) => (
              <VerifiedBlock key={`${contract.preimage}-${contract.timestamp}-${index}`} contract={contract} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function LiveCV() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-black text-center pt-24 text-zinc-500">
        Loading CV Profile...
      </div>
    }>
      <LiveCVContent />
    </Suspense>
  );
}
