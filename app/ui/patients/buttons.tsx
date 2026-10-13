import { PencilIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { deletePatient } from '@/app/lib/actions';

export function CreatePatient() {
  return (
    <Link
      href="/dashboard/patients/create"
      className="flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white transition-colors hover:bg-emerald-500 md:px-4"
    >
      <UserPlusIcon className="h-5 w-5" />
      <span>Add patient</span>
    </Link>
  );
}

export function UpdatePatient({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/patients/${id}/edit`}
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <PencilIcon className="w-5" />
    </Link>
  );
}

export function DeletePatient({ id }: { id: string }) {
  const deletePatientWithId = deletePatient.bind(null, id);
  return (
    <form action={deletePatientWithId}>
      <button type="submit" className="rounded-md border p-2 hover:bg-gray-100">
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-5" />
      </button>
    </form>
  );
}