import { fetchPatients } from '@/app/lib/supabase-data';
import { CreatePatient, UpdatePatient, DeletePatient } from '@/app/ui/patients/buttons';
import { lusitana } from '@/app/ui/fonts';

export default async function Page() {
  const patients = await fetchPatients();

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Patients</h1>
        <CreatePatient />
      </div>

      {patients.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">No patients yet. Add the first one.</p>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <ul className="mt-6 space-y-3 md:hidden">
            {patients.map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
              >
                <p className="truncate font-medium text-gray-900">{p.full_name}</p>
                <dl className="mt-2 space-y-1 text-sm text-gray-500">
                  <div className="flex justify-between gap-3">
                    <dt>Phone</dt>
                    <dd className="text-gray-700">{p.phone || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Date of birth</dt>
                    <dd className="text-gray-700">{p.date_of_birth || '—'}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex justify-end gap-3">
                  <UpdatePatient id={p.id} />
                  <DeletePatient id={p.id} />
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <table className="mt-6 hidden min-w-full text-gray-900 md:table">
            <thead className="text-left text-sm font-normal">
              <tr>
                <th className="px-4 py-3 font-medium">Full name</th>
                <th className="px-3 py-3 font-medium">Phone</th>
                <th className="px-3 py-3 font-medium">Date of birth</th>
                <th className="py-3 pl-6 pr-3"><span className="sr-only">Edit</span></th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {patients.map((p) => (
                <tr key={p.id} className="border-b text-sm">
                  <td className="whitespace-nowrap px-4 py-3">{p.full_name}</td>
                  <td className="whitespace-nowrap px-3 py-3">{p.phone ?? ''}</td>
                  <td className="whitespace-nowrap px-3 py-3">{p.date_of_birth ?? ''}</td>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex justify-end gap-3">
                      <UpdatePatient id={p.id} />
                      <DeletePatient id={p.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}