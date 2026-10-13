'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/app/ui/settings/settings-context';
import { nowDateTimeLocal } from '@/app/lib/time';

// A calendar + time-slot picker for appointment start times.
//
// Everything is treated as clinic-local wall time in the fixed +02:00 zone, as
// 'YYYY-MM-DDTHH:mm' strings — the same format `fromDateTimeLocal` expects — so
// the picker never does timezone math. `takenSlots` must already be normalised
// to that format (see the create/edit pages, which use `toDateTimeLocal`).
//
// Visual model:
//  - A day that has any appointment is tinted (amber) — it is NOT red.
//  - In the time grid, only a booked start time itself is light red.

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// Clinic hours: 08:00–17:30 in 30-minute slots (each appointment holds one slot).
const SLOT_START_HOUR = 8;
const SLOT_END_HOUR = 17;

const pad = (n: number) => String(n).padStart(2, '0');

function buildTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = SLOT_START_HOUR; h <= SLOT_END_HOUR; h++) {
    slots.push(`${pad(h)}:00`);
    if (h !== SLOT_END_HOUR) slots.push(`${pad(h)}:30`);
  }
  return slots;
}
const TIME_SLOTS = buildTimeSlots();

export default function DateTimePicker({
  name,
  value,
  onChange,
  takenSlots,
  disallowPast = false,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  takenSlots: string[];
  disallowPast?: boolean;
}) {
  const { isDark, accent } = useSettings();

  // "now" in clinic-local form, computed after mount so SSR/client markup match.
  const [minNow, setMinNow] = useState('');
  useEffect(() => {
    if (disallowPast) setMinNow(nowDateTimeLocal());
  }, [disallowPast]);
  const minDate = minNow.slice(0, 10); // 'YYYY-MM-DD'
  const minTime = minNow.slice(11, 16); // 'HH:mm'

  const selectedDate = value.slice(0, 10);
  const selectedTime = value.slice(11, 16);

  // Visible month; initialise from the current value (or today) once on mount.
  const [view, setView] = useState(() => {
    const base = value ? new Date(`${value.slice(0, 10)}T00:00:00`) : new Date();
    return { y: base.getFullYear(), m: base.getMonth() };
  });

  const takenSet = useMemo(() => new Set(takenSlots), [takenSlots]);
  const takenDates = useMemo(
    () => new Set(takenSlots.map((s) => s.slice(0, 10))),
    [takenSlots],
  );

  // A time slot is "booked" (light red) only if an appointment starts exactly there.
  const isBookedSlot = (ds: string, t: string) => takenSet.has(`${ds}T${t}`);

  const isPastDay = (dateStr: string) => disallowPast && dateStr < minDate;
  const isPastSlot = (dateStr: string, time: string) =>
    disallowPast && dateStr === minDate && time < minTime;

  const firstOfMonth = new Date(view.y, view.m, 1);
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7; // Monday-first

  const monthLabel = firstOfMonth.toLocaleString('en-ZA', { month: 'long', year: 'numeric' });

  const shiftMonth = (delta: number) =>
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const dateStr = (day: number) => `${view.y}-${pad(view.m + 1)}-${pad(day)}`;

  const pickDay = (day: number) => {
    const ds = dateStr(day);
    if (isPastDay(ds)) return;
    let time = selectedTime && TIME_SLOTS.includes(selectedTime) ? selectedTime : '09:00';
    const slotFree = (t: string) => !isBookedSlot(ds, t) && !isPastSlot(ds, t);
    if (!slotFree(time)) {
      const free = TIME_SLOTS.find(slotFree);
      time = free ?? '09:00';
    }
    onChange(`${ds}T${time}`);
  };

  const pickTime = (time: string) => {
    if (!selectedDate) return;
    if (isBookedSlot(selectedDate, time) || isPastSlot(selectedDate, time)) return;
    onChange(`${selectedDate}T${time}`);
  };

  const prevDisabled = disallowPast && `${view.y}-${pad(view.m + 1)}` <= minDate.slice(0, 7);

  const dayBase = 'flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors';
  // Days with appointments are amber ("busy"), NOT red — red is reserved for the
  // booked time slots in the grid below.
  const hasApptsCls = isDark ? 'bg-amber-900/40 text-amber-200' : 'bg-amber-100 text-amber-800';
  const selectedCls = 'bg-green-500/25 ring-2 ring-green-500 font-semibold';
  const pastCls = isDark ? 'text-gray-600' : 'text-gray-300';
  const idleCls = isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100';

  return (
    <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
      <input type="hidden" name={name} value={value} readOnly />

      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={prevDisabled}
          aria-label="Previous month"
          className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-700"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{monthLabel}</span>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
          className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-xs font-medium text-gray-400">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 justify-items-center">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <span key={`blank-${i}`} className="h-9 w-9" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const ds = dateStr(day);
          const past = isPastDay(ds);
          const hasAppts = takenDates.has(ds);
          const selected = ds === selectedDate;
          return (
            <button
              key={ds}
              type="button"
              onClick={() => pickDay(day)}
              disabled={past}
              aria-pressed={selected}
              title={past ? 'Past date' : hasAppts ? 'Has appointments' : undefined}
              className={clsx(
                dayBase,
                past && `${pastCls} cursor-not-allowed`,
                !past && selected && selectedCls,
                !past && !selected && hasAppts && hasApptsCls,
                !past && !selected && !hasAppts && idleCls,
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-amber-100 ring-1 ring-amber-300 dark:bg-amber-900/40" />
          Has appts
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-red-100 ring-1 ring-red-300 dark:bg-red-900/50" />
          Booked
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-green-500/25 ring-1 ring-green-500" />
          Selected
        </span>
        {disallowPast && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-gray-200 dark:bg-gray-700" />
            Past
          </span>
        )}
      </div>

      <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-700">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
            {selectedDate
              ? `Times - ${new Date(`${selectedDate}T00:00:00`).toLocaleString('en-ZA', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                })}`
              : 'Pick a date first'}
          </span>
          {value && (
            <span className="text-xs font-medium" style={{ color: accent }}>
              {value.slice(11, 16)}
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
          {TIME_SLOTS.map((t) => {
            const booked = selectedDate ? isBookedSlot(selectedDate, t) : false;
            const past = selectedDate ? isPastSlot(selectedDate, t) : false;
            const selected = t === selectedTime;
            const disabled = booked || past || !selectedDate;
            return (
              <button
                key={t}
                type="button"
                onClick={() => pickTime(t)}
                disabled={disabled}
                aria-pressed={selected}
                title={past ? 'Past time' : booked ? 'Booked (30-min block)' : undefined}
                className={clsx(
                  'rounded-md border px-1 py-1.5 text-xs transition-colors',
                  disabled && 'cursor-not-allowed',
                  booked &&
                    (isDark
                      ? 'border-red-800 bg-red-900/50 text-red-200'
                      : 'border-red-200 bg-red-100 text-red-700'),
                  past &&
                    (isDark
                      ? 'border-gray-700 bg-gray-800 text-gray-600'
                      : 'border-gray-200 bg-gray-100 text-gray-300'),
                  !booked &&
                    !past &&
                    selected &&
                    'border-green-500 bg-green-500/25 font-semibold text-green-800 ring-1 ring-green-500 dark:text-green-200',
                  !booked &&
                    !past &&
                    !selected &&
                    selectedDate &&
                    (isDark
                      ? 'border-gray-700 text-gray-200 hover:bg-gray-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-100'),
                  !selectedDate &&
                    (isDark
                      ? 'border-gray-800 bg-gray-800/50 text-gray-600'
                      : 'border-gray-100 bg-gray-50 text-gray-300'),
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
