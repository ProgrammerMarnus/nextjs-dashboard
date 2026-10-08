import Table from '@/app/ui/customers/table';
import { fetchFilteredCustomers } from '@/app/lib/supabase-data';
import { Suspense } from 'react';
import { CustomersTableSkeleton } from '@/app/ui/skeletons';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customers',
};

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const customers = await fetchFilteredCustomers(query);

  return (
    <main className="w-full">
      <Suspense key={query} fallback={<CustomersTableSkeleton />}>
        <Table customers={customers} />
      </Suspense>
    </main>
  );
}