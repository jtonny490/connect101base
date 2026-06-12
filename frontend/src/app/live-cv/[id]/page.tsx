'use client';
import { useParams, useSearchParams } from 'next/navigation';
import { useState, Suspense, useEffect, useRef, useSyncExternalStore } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getBackendUrl } from '@/lib/backend';

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
  verifiedAt?: number;
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

function saveDealStatus(preimage: string, status: string) {
  if (!preimage) return;

  const saved = localStorage.getItem(`deal_${preimage}`);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved) as Deal;
    localStorage.setItem(`deal_${preimage}`, JSON.stringify({ ...parsed, status }));
    window.dispatchEvent(new Event('deallock-storage'));
  } catch {
    // Ignore malformed demo data.
  }
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
        verifiedAt: Number(contract.verifiedAt || timestamp),
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
  const [isJustVerified, setIsJustVerified] = useState(Boolean(contract.isNew));
  const [isValid, setIsValid] = useState<boolean | null>(
    contract.isSeed || contract.isNew ? true : null
  );

  useEffect(() => {
    if (!contract.isNew) return;

    const ageMs = Date.now() - (contract.verifiedAt || contract.timestamp);
    const timeout = window.setTimeout(() => setIsJustVerified(false), Math.max(0, 30000 - ageMs));
    return () => window.clearTimeout(timeout);
  }, [contract.isNew, contract.timestamp, contract.verifiedAt]);

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
          {!isValid ? '⚠ Unverified' : isJustVerified ? '✔ Just Verified' : '✔ Verified Bitcoin Payment'}
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
