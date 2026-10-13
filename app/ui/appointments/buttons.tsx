import { PencilIcon, TrashIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { deleteAppointment, setAppointmentStatus } from '@/app/lib/actions';

export function CreateAppointment() {
  return (
    <Link
      href="/dashboard/appointments/create"
      className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 md:px-4"
    >
      <CalendarDaysIcon className="h-5 w-5" />
      <span>New appointment</span>
    </Link>
  );
}

export function UpdateAppointment({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/appointments/${id}/edit`}
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <span className="sr-only">Edit</span>
      <PencilIcon className="w-5" />
    </Link>
  );
}

export function DeleteAppointment({ id }: { id: string }) {
  const deleteAppointmentWithId = deleteAppointment.bind(null, id);
  return (
    <form action={deleteAppointmentWithId}>
      <button type="submit" className="rounded-md border p-2 hover:bg-gray-100">
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-5" />
      </button>
    </form>
  );
}

type ResolveStatus = 'done' | 'no_show' | 'cancelled';

const RESOLVE_STYLES: Record<ResolveStatus, string> = {
  done: 'bg-green-100 text-green-700 hover:bg-green-200 focus-visible:outline-green-600',
  no_show: 'bg-amber-100 text-amber-700 hover:bg-amber-200 focus-visible:outline-amber-600',
  cancelled: 'bg-rose-100 text-rose-700 hover:bg-rose-200 focus-visible:outline-rose-600',
};

const RESOLVE_LABELS: Record<ResolveStatus, string> = {
  done: 'Done',
  no_show: 'No-show',
  cancelled: 'Cancel',
};

// Marks an upcoming appointment done / no-show / cancelled.
// - done & no_show are enabled only after the slot has started (server-computed).
// - cancelled can be used any time before the slot starts.
export function ResolveAppointment({
  id,
  status,
  enabled,
}: {
  id: string;
  status: ResolveStatus;
  enabled: boolean;
}) {
  const resolve = setAppointmentStatus.bind(null, id, status);
  const disabledHint =
    status === 'cancelled'
      ? 'Can only cancel before the appointment starts'
      : 'Available once the appointment starts';
  return (
    <form action={resolve}>
      <button
        type="submit"
        disabled={!enabled}
        title={enabled ? `Mark ${RESOLVE_LABELS[status].toLowerCase()}` : disabledHint}
        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${RESOLVE_STYLES[status]}`}
      >
        {RESOLVE_LABELS[status]}
      </button>
    </form>
  );
}