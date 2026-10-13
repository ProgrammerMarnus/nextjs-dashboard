import { AppointmentsTableSkeleton } from '@/app/ui/skeletons';

// Suspense fallback while the appointments list (a Server Component) fetches data.
export default function Loading() {
  return <AppointmentsTableSkeleton />;
}
