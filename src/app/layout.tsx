import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Stopora",
  description: "Find the best order for your delivery stops in Lagos, Nigeria.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex flex-col antialiased">
        <ToastProvider>
          {/* Header navigation */}
          <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2 font-black text-xl text-blue-600 dark:text-blue-400 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-1"
                aria-label="Stopora Home"
              >
                <span>🚚</span>
                <span>Stopora</span>
              </Link>
              <nav className="flex items-center gap-1 sm:gap-2">
                <Link
                  href="/runs"
                  className="min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800 transition-colors flex items-center"
                >
                  Recent Runs
                </Link>
                <Link
                  href="/plan"
                  className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center shadow-sm"
                >
                  + Plan Run
                </Link>
              </nav>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 flex flex-col">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
