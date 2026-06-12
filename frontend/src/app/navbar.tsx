'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black py-4 px-6 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-black tracking-tight text-zinc-900 dark:text-white text-lg">
          ⚡ DealLock
        </Link>
        <div className="flex items-center gap-6 text-sm font-semibold">
          <Link href="/dashboard" className={`transition ${pathname === '/dashboard' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'}`}>
            Dashboard
          </Link>
          <Link href="/create-deal" className={`transition ${pathname === '/create-deal' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'}`}>
            New Lockbox
          </Link>
          <Link href="/live-cv/juma-codes" className={`transition ${pathname.includes('/live-cv') ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'}`}>
            My Live CV
          </Link>
        </div>
      </div>
    </nav>
  );
}
