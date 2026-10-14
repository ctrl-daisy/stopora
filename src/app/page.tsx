export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-blue-600">Stopora</h1>
        <p className="text-gray-600">Find the best order for your delivery stops</p>
        <button
          type="button"
          disabled
          className="mt-4 px-6 py-2.5 rounded-lg bg-gray-200 text-gray-400 font-medium cursor-not-allowed"
        >
          Plan a route
        </button>
      </div>
    </main>
  );
}
