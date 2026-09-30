import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Create a Supabase server client that reads and writes cookies,
// so sessions stay in sync between Server Components and Server Actions.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component, which cannot set cookies.
            // Safe to ignore: session refresh is handled in utils/supabase/proxy.ts.
          }
        },
      },
    },
  );
}