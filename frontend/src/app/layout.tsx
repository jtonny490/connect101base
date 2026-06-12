import "./globals.css";
import Navbar from "./navbar";

export const metadata = {
  title: "DealLock Protocol",
  description: "Portable Trust and Universal Escrow Layer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Add suppressHydrationWarning here
    <html lang="en" suppressHydrationWarning>
      {/* And ALSO add suppressHydrationWarning directly here to the body tag */}
      <body className="antialiased bg-zinc-50 dark:bg-black" suppressHydrationWarning>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
