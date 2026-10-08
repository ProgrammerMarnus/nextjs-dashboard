import { createClient } from '@/utils/supabase/server';
import { formatCurrency } from './utils';
import { unstable_cache } from 'next/cache';
import type { CustomersTableType, FormattedCustomersTable } from './definitions';

export type Invoice = {
  id: string;
  customer_id: string;
  amount: number;
  status: 'pending' | 'paid';
  date: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  image_url: string;
};

export type InvoicesTable = {
  id: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid';
  name: string;
  email: string;
  image_url: string;
};

export type LatestInvoiceRaw = {
  id: string;
  amount: number;
  name: string;
  email: string;
  image_url: string;
};

export type FormattedLatestInvoice = Omit<LatestInvoiceRaw, 'amount'> & {
  amount: string;
};

export type Revenue = {
  month: string;
  revenue: number;
};

export type Patient = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  date_of_birth: string | null;
  created_at: string;
};

export type PatientsPerMonth = {
  month_start: string;
  label: string;
  new_patients: number;
};

export interface AppointmentRow {
  id: string;
  starts_at: string;
  status: 'booked' | 'done' | 'no_show';
  patients: { full_name: string } | null;
}

export interface StatusRow {
  status: 'booked' | 'done' | 'no_show';
  total: number;
}

const ITEMS_PER_PAGE = 6;

export async function fetchRevenue(): Promise<Revenue[]> {
  return unstable_cache(
    async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('revenue')
        .select('month, revenue')
        .order('month', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error('Failed to fetch revenue data.');
      }
      return data as Revenue[];
    },
    ['revenue'],
    { revalidate: 3600, tags: ['revenue'] }
  )();
}

export async function fetchLatestInvoices(): Promise<FormattedLatestInvoice[]> {
  return unstable_cache(
    async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('invoices')
        .select('id, amount, date, status, customers!inner(name, email, image_url)')
        .order('date', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error('Failed to fetch the latest invoices.');
      }

      return (data as unknown as LatestInvoiceRaw[]).map((invoice) => ({
        ...invoice,
        amount: formatCurrency(invoice.amount),
      }));
    },
    ['latest-invoices'],
    { revalidate: 60, tags: ['invoices'] }
  )();
}

export async function fetchCardData() {
  return unstable_cache(
    async () => {
      const supabase = await createClient();

      const [invoiceCount, customerCount, invoiceStatus] = await Promise.all([
        supabase.from('invoices').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase
          .from('invoices')
          .select('status, amount')
          .then(({ data, error }) => {
            if (error) throw error;
            const paid = data
              ?.filter((i) => i.status === 'paid')
              .reduce((sum, i) => sum + i.amount, 0) || 0;
            const pending = data
              ?.filter((i) => i.status === 'pending')
              .reduce((sum, i) => sum + i.amount, 0) || 0;
            return { paid, pending };
          }),
      ]);

      if (invoiceCount.error) throw new Error(invoiceCount.error.message);
      if (customerCount.error) throw new Error(customerCount.error.message);

      const numberOfInvoices = invoiceCount.count || 0;
      const numberOfCustomers = customerCount.count || 0;
      const totalPaidInvoices = formatCurrency((await invoiceStatus).paid);
      const totalPendingInvoices = formatCurrency((await invoiceStatus).pending);

      return {
        numberOfCustomers,
        numberOfInvoices,
        totalPaidInvoices,
        totalPendingInvoices,
      };
    },
    ['card-data'],
    { revalidate: 60, tags: ['invoices', 'customers'] }
  )();
}

export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
): Promise<InvoicesTable[]> {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const searchTerm = `%${query}%`;

  const supabase = await createClient();
  let queryBuilder = supabase
    .from('invoices')
    .select(
      `
      id,
      amount,
      date,
      status,
      customers!inner (
        name,
        email,
        image_url
      )
    `,
      { count: 'exact' }
    )
    .order('date', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  if (query) {
    queryBuilder = queryBuilder.or(
      `customers.name.ilike.${searchTerm},customers.email.ilike.${searchTerm},amount.ilike.${searchTerm},date.ilike.${searchTerm},status.ilike.${searchTerm}`
    );
  }

  const { data, error, count } = await queryBuilder;

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch invoices.');
  }

  return (data as unknown as InvoicesTable[]) || [];
}

export async function fetchInvoicesPages(query: string): Promise<number> {
  const searchTerm = `%${query}%`;
  const supabase = await createClient();

  let queryBuilder = supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true });

  if (query) {
    queryBuilder = queryBuilder.or(
      `customers.name.ilike.${searchTerm},customers.email.ilike.${searchTerm},amount.ilike.${searchTerm},date.ilike.${searchTerm},status.ilike.${searchTerm}`
    );
  }

  const { count, error } = await queryBuilder;

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }

  return Math.ceil((count || 0) / ITEMS_PER_PAGE);
}

export async function fetchInvoiceById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('id, customer_id, amount, status')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch invoice.');
  }

  return {
    ...data,
    amount: data.amount / 100,
  };
}

export async function fetchCustomers(): Promise<Customer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customers')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch all customers.');
  }

  return data as Customer[];
}

export async function fetchFilteredCustomers(
  query: string
): Promise<FormattedCustomersTable[]> {
  const searchTerm = `%${query}%`;
  const supabase = await createClient();

  let queryBuilder = supabase.from('customers').select(
    `
      id,
      name,
      email,
      image_url,
      invoices!left (
        id,
        amount,
        status
      )
    `
  );

  if (query) {
    queryBuilder = queryBuilder.or(
      `name.ilike.${searchTerm},email.ilike.${searchTerm}`
    );
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch customer table.');
  }

  return (
    (data as unknown as CustomersTableType[])
      ?.map((customer) => {
        const invoices = (customer as any).invoices || [];
        const total_pending = invoices
          .filter((i: any) => i.status === 'pending')
          .reduce((sum: number, i: any) => sum + i.amount, 0);
        const total_paid = invoices
          .filter((i: any) => i.status === 'paid')
          .reduce((sum: number, i: any) => sum + i.amount, 0);

        return {
          ...customer,
          total_invoices: invoices.length,
          total_pending: formatCurrency(total_pending),
          total_paid: formatCurrency(total_paid),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name)) || []
  );
}

export async function fetchPatients(): Promise<Patient[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('patients')
    .select('id, user_id, full_name, phone, date_of_birth, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch patients.');
  }
  return data as Patient[];
}

export async function fetchPatientsPerMonth(): Promise<PatientsPerMonth[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('patients_per_month')
    .select('month_start, label, new_patients')
    .order('month_start', { ascending: true });

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch patients per month.');
  }
  return data as PatientsPerMonth[];
}

export async function fetchAppointments(): Promise<AppointmentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('appointments')
    .select('id, starts_at, status, patients ( full_name )')
    .order('starts_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as unknown as AppointmentRow[];
}

export async function fetchAppointmentStatusThisMonth(): Promise<StatusRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('appointment_status_this_month').select('status, total');
  if (error) throw new Error(error.message);
  return data as StatusRow[];
}

export async function fetchPatientOptions(): Promise<{ id: string; full_name: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('patients').select('id, full_name').order('full_name');
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchPatientById(id: string): Promise<Patient | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('patients')
    .select('id, user_id, full_name, phone, date_of_birth, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch patient.');
  }
  return (data as Patient | null) ?? null;
}

export async function fetchAppointmentById(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('appointments')
    .select('id, patient_id, starts_at, status')
    .eq('id', id)
    .single();
  return data;
}