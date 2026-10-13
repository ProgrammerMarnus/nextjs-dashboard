import { describe, it, expect, vi } from 'vitest';
import { AppError } from './errors';
import {
  createAppointment,
  updateAppointment,
  deleteAppointment,
  setAppointmentStatus,
  deletePatient,
  signIn,
  createPatient,
} from './actions';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

// The mock lives in this file so actions.ts and the test share ONE createClient instance.
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('postgres', () => ({
  default: vi.fn(() => ({ query: vi.fn(), end: vi.fn() })),
}));

const makeFormData = (overrides: Record<string, unknown> = {}) => {
  const fd = new FormData();
  Object.entries(overrides).forEach(([key, value]) => {
    fd.set(key, String(value));
  });
  return fd;
};

// Build a client whose query builder records the calls we assert on.
const supabaseStub = (response: { error: Error | null } = { error: null }) => {
  const eqFn = vi.fn().mockResolvedValue(response);
  const insertFn = vi.fn().mockResolvedValue(response);
  const updateFn = vi.fn(() => ({ eq: eqFn }));
  const deleteFn = vi.fn(() => ({ eq: eqFn }));
  const client = {
    from: vi.fn(() => ({
      insert: insertFn,
      update: updateFn,
      delete: deleteFn,
    })),
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    },
  };
  return { client, eqFn, insertFn, updateFn, deleteFn };
};

const setClient = (client: unknown) => {
  (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);
};

describe('Server Actions', () => {
  describe('createAppointment', () => {
    const initialState = { message: null, errors: {} };

    it('should insert a row on success', async () => {
      const { client, insertFn } = supabaseStub({ error: null });
      setClient(client);

      await createAppointment(initialState, makeFormData({
        patient_id: '123e4567-e89b-12d3-a456-426614174000',
        starts_at: '2024-01-15T10:00',
        status: 'booked',
      }));

      expect(client.from).toHaveBeenCalledWith('appointments');
      expect(insertFn).toHaveBeenCalledWith({
        patient_id: '123e4567-e89b-12d3-a456-426614174000',
        starts_at: '2024-01-15T10:00:00+02:00',
        status: 'booked',
      });
    });

    it('should throw AppError when insert fails', async () => {
      const { client } = supabaseStub({ error: new Error('db boom') });
      setClient(client);

      await expect(createAppointment(initialState, makeFormData({
        patient_id: '123e4567-e89b-12d3-a456-426614174000',
        starts_at: '2024-01-15T10:00',
        status: 'booked',
      }))).rejects.toBeInstanceOf(AppError);
    });

    it('should return a friendly message when the slot is taken (23P01)', async () => {
      const conflict = Object.assign(new Error('exclusion constraint violated'), {
        code: '23P01',
      });
      const { client } = supabaseStub({ error: conflict });
      setClient(client);

      const result = await createAppointment(initialState, makeFormData({
        patient_id: '123e4567-e89b-12d3-a456-426614174000',
        starts_at: '2024-01-15T10:00',
        status: 'booked',
      }));

      expect(result.message).toMatch(/already taken/i);
    });
  });

  describe('updateAppointment', () => {
    const initialState = { message: null, errors: {} };

    it('should update the row on success', async () => {
      const { client, updateFn } = supabaseStub({ error: null });
      setClient(client);

      await updateAppointment('123e4567-e89b-12d3-a456-426614174000', initialState, makeFormData({
        patient_id: '123e4567-e89b-12d3-a456-426614174000',
        starts_at: '2024-01-15T11:00',
        status: 'done',
      }));

      expect(client.from).toHaveBeenCalledWith('appointments');
      expect(updateFn).toHaveBeenCalledWith({
        patient_id: '123e4567-e89b-12d3-a456-426614174000',
        starts_at: '2024-01-15T11:00:00+02:00',
        status: 'done',
      });
    });

    it('should return a friendly message when the new slot is taken (23P01)', async () => {
      const conflict = Object.assign(new Error('exclusion constraint violated'), {
        code: '23P01',
      });
      const { client } = supabaseStub({ error: conflict });
      setClient(client);

      const result = await updateAppointment('123e4567-e89b-12d3-a456-426614174000', initialState, makeFormData({
        patient_id: '123e4567-e89b-12d3-a456-426614174000',
        starts_at: '2024-01-15T11:00',
        status: 'done',
      }));

      expect(result.message).toMatch(/already taken/i);
    });

    it('should throw AppError for an invalid ID', async () => {
      await expect(
        updateAppointment('not-a-uuid' as unknown as string, initialState, makeFormData()),
      ).rejects.toThrow('Invalid appointment ID.');
    });
  });

  describe('deleteAppointment', () => {
    it('should delete the appointment row', async () => {
      const { client, deleteFn } = supabaseStub({ error: null });
      setClient(client);

      await deleteAppointment('123e4567-e89b-12d3-a456-426614174000');

      expect(client.from).toHaveBeenCalledWith('appointments');
      expect(deleteFn).toHaveBeenCalled();
    });
  });

  describe('setAppointmentStatus', () => {
    it('should update only the status column', async () => {
      const { client, updateFn } = supabaseStub({ error: null });
      setClient(client);

      await setAppointmentStatus('123e4567-e89b-12d3-a456-426614174000', 'done');

      expect(client.from).toHaveBeenCalledWith('appointments');
      expect(updateFn).toHaveBeenCalledWith({ status: 'done' });
    });

    it('should throw AppError when the update fails', async () => {
      const { client } = supabaseStub({ error: new Error('db boom') });
      setClient(client);

      await expect(
        setAppointmentStatus('123e4567-e89b-12d3-a456-426614174000', 'no_show'),
      ).rejects.toBeInstanceOf(AppError);
    });

    it('should throw AppError for an invalid ID', async () => {
      await expect(
        setAppointmentStatus('not-a-uuid' as unknown as string, 'done'),
      ).rejects.toThrow('Invalid appointment ID.');
    });
  });

  describe('deletePatient', () => {
    it('should delete the patient row', async () => {
      const { client, deleteFn } = supabaseStub({ error: null });
      setClient(client);

      await deletePatient('123e4567-e89b-12d3-a456-426614174000');

      expect(client.from).toHaveBeenCalledWith('patients');
      expect(deleteFn).toHaveBeenCalled();
    });
  });

  describe('signIn', () => {
    it('should sign in and redirect on success', async () => {
      const { client } = supabaseStub({ error: null });
      setClient(client);

      await signIn({ error: null }, makeFormData({
        email: 'user@nextmail.com',
        password: '123456',
        redirectTo: '/dashboard',
      }));

      expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@nextmail.com',
        password: '123456',
      });
      expect(redirect).toHaveBeenCalledWith('/dashboard');
    });

    it('should return error on failed sign in', async () => {
      const { client } = supabaseStub({ error: null });
      client.auth.signInWithPassword = vi.fn().mockResolvedValue({ error: new Error('nope') });
      setClient(client);

      const result = await signIn({ error: null }, makeFormData({
        email: 'user@nextmail.com',
        password: '123456',
      }));

      expect(result.error).toBe('Invalid credentials.');
    });
  });

  describe('PatientSchema validation (via createPatient)', () => {
    it('should return the custom error when full_name is empty', async () => {
      const { client } = supabaseStub({ error: null });
      setClient(client);

      const result = await createPatient({ errors: {}, message: null }, makeFormData({
        full_name: '',
        phone: '123456',
      }));

      expect(result.errors?.full_name).toContain("Please enter the patient's full name.");
    });
  });
});
