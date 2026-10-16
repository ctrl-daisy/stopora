import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col justify-center px-4 py-8 sm:py-16 max-w-3xl mx-auto w-full space-y-10 sm:space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
          <span>🇳🇬</span> Built for Lagos Roads
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
          Smartest delivery routes for Lagos dispatchers.
        </h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto leading-relaxed">
          Stopora calculates the optimal visiting sequence for your delivery stops in seconds, eliminating backtracking and cutting fuel costs across Lagos road networks with instant turn-by-turn navigation handoff.
        </p>

        {/* Primary CTA Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/plan"
            className="w-full sm:w-auto min-h-[52px] px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <span>Plan a route</span>
            <span>→</span>
          </Link>
          <Link
            href="/runs"
            className="w-full sm:w-auto min-h-[52px] px-6 py-3.5 bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-2xl font-semibold text-base transition-all flex items-center justify-center"
          >
            View recent runs
          </Link>
        </div>
      </section>

      {/* 3-Step How It Works */}
      <section className="space-y-6">
        <h2 className="text-xl sm:text-2xl font-extrabold text-center text-gray-900 dark:text-white">
          How it works
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Step 1 */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-extrabold flex items-center justify-center text-lg">
              1
            </div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Add delivery stops
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-normal">
              Search Lagos street addresses or drop pins directly onto the interactive map for up to 12 stops.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-extrabold flex items-center justify-center text-lg">
              2
            </div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Tap optimize
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-normal">
              Our route engine calculates the proven shortest road distance order in under 200 ms.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-extrabold flex items-center justify-center text-lg">
              3
            </div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Follow the numbers
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-normal">
              Follow numbered stops on the map, open each leg in Google Maps, and mark packages as delivered.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
