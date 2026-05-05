export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto text-slate-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4v2m0 4v2M7 9v2m0 4v2M3 9v2m0 4v2"
            />
          </svg>
          <h1 className="text-4xl font-bold text-white mb-2">ID Not Found</h1>
          <p className="text-slate-400 text-lg">
            The SK Official ID you are looking for does not exist.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <a
            href="/dashboard/officials"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            View All Officials
          </a>
        </div>
      </div>
    </div>
  );
}
