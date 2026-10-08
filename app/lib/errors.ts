export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown, fallbackMessage: string): AppError {
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR', 500, error);
  }
  return new AppError(fallbackMessage, 'UNKNOWN_ERROR', 500, error);
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: AppError };