import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-zinc-50 font-sans dark:bg-black text-zinc-900 dark:text-zinc-50 px-6">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-20 text-center sm:items-start sm:text-left space-y-8">
        
        {/* Visual Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium">
          ⚡ DealLock Protocol
        </div>

        {/* Hero Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Portable Trust for the <span className="text-amber-500 dark:text-amber-400">Internet Economy</span>
          </h1>
          <p className="max-w-xl text-lg sm:text-xl leading-relaxed text-zinc-600 dark:text-zinc-400">
            The universal escrow and reputation layer. Secure your off-platform payments on Bitcoin rails and automatically update your verified cryptographic CV.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4">
          <Link 
            href="/create-deal" 
            className="flex h-12 items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 transition-all shadow-lg shadow-amber-500/10 sm:min-w-[160px]"
          >
            Lock a New Deal
          </Link>
          
          <Link 
            href="/dashboard" 
            className="flex h-12 items-center justify-center rounded-xl border border-solid border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-50 px-6 transition-all font-semibold sm:min-w-[160px]"
          >
            View Dashboard
          </Link>
        </div>

      </main>
    </div>
  );
}
