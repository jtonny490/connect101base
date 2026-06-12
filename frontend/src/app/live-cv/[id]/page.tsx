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
