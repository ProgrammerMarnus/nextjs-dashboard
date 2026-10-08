import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError, handleError, isAppError } from './errors';

describe('Error Handling', () => {
  describe('AppError', () => {
    it('should create an error with all properties', () => {
      const error = new AppError('Test message', 'TEST_CODE', 400, { detail: 'info' });
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.status).toBe(400);
      expect(error.details).toEqual({ detail: 'info' });
      expect(error.name).toBe('AppError');
    });

    it('should default status to 500', () => {
      const error = new AppError('Test message', 'TEST_CODE');
      expect(error.status).toBe(500);
    });
  });

  describe('handleError', () => {
    it('should return AppError as-is', () => {
      const appError = new AppError('Original', 'ORIGINAL_CODE', 400);
      const result = handleError(appError, 'fallback');
      expect(result).toBe(appError);
    });

    it('should wrap Error in AppError', () => {
      const error = new Error('Database connection failed');
      const result = handleError(error, 'fallback message');
      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Database connection failed');
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.status).toBe(500);
      expect(result.details).toBe(error);
    });

    it('should wrap unknown errors in AppError with fallback message', () => {
      const result = handleError('string error', 'fallback message');
      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('fallback message');
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.details).toBe('string error');
    });

    it('should handle null/undefined errors', () => {
      const result = handleError(null, 'fallback message');
      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('fallback message');
    });
  });

  describe('isAppError', () => {
    it('should return true for AppError instances', () => {
      expect(isAppError(new AppError('test', 'TEST'))).toBe(true);
    });

    it('should return false for regular Errors', () => {
      expect(isAppError(new Error('test'))).toBe(false);
    });

    it('should return false for other types', () => {
      expect(isAppError('string')).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
      expect(isAppError({})).toBe(false);
    });
  });
});