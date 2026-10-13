'use client';

import { useEffect } from 'react';

// Error boundary for every /dashboard/* route. Catches errors thrown by Server
// Components (data fetches that raise AppError) and Server Actions, so the whole
// app doesn't crash with an unhandled 500. `reset` retries the failed segment.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <main className="flex h-full flex-col items-center justify-center gap-2">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-sm text-gray-600">
        We couldn&apos;t load this page. This is usually a temporary database or
        connection problem.
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-400"
      >
        Try again
      </button>
    </main>
  );
}
