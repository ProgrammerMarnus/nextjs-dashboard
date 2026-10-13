import { PatientsTableSkeleton } from '@/app/ui/skeletons';

// Suspense fallback while the patients list (a Server Component) fetches data.
export default function Loading() {
  return <PatientsTableSkeleton />;
}
