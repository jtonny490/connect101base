import Link from "next/link";

export default function Dashboard() {
  const activeDeals = [
    {
      id: "1",
      title: "Mobile App API Backend",
      amount: "45,000 Sats",
      status: "Funds Secured",
      client: "AlphaCorp (US)",
      origin: "LinkedIn",
    },
    {
      id: "2",
      title: "Sheng Translation Voiceover",
      amount: "12,500 Sats",
      status: "Awaiting Client Funding",
      client: "David K.",
      origin: "WhatsApp",
    },
  ];

  const completedDeals = [
    {
      id: "3",
      title: "Landing Page Redesign",
      amount: "10,000 Sats",
      status: "Done Deal",
      client: "Maya R.",
      origin: "WhatsApp",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Provider Hub</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              Manage active financial agreements and verify your live reputation
              network footprint.
            </p>
          </div>
          <Link
            href="/create-deal"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-sm transition text-center"
          >
            + New TrustLink
          </Link>
        </div>

        {/* Global Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Total Career Earnings
            </p>
            <p className="text-2xl font-black mt-1">
              284,500{" "}
              <span className="text-sm font-normal text-amber-500">Sats</span>
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Verified Live CV Contracts
            </p>
            <p className="text-2xl font-black mt-1 text-zinc-900 dark:text-white">
              14{" "}
              <span className="text-sm font-normal text-emerald-500 dark:text-emerald-400">
                Completed
              </span>
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Global Trust Score
            </p>
            <p className="text-2xl font-black text-amber-500 mt-1">
              98.4%{" "}
              <span className="text-sm font-normal text-zinc-500">
                Excellent
              </span>
            </p>
          </div>
        </div>

 