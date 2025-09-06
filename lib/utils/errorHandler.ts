// Centralized error handling utility following DRY principles
export class ErrorHandler {
  static handleNetworkError(error: unknown, context: string): string {
    console.error(`[${context}] Network error:`, error);
    return 'Network error. Please try again.';
  }

  static handleApiError(error: unknown, context: string): void {
    console.error(`[${context}] API error:`, error);
  }

  static isAppwriteError(error: unknown): error is { code: number; message: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      typeof (error as { code: unknown }).code === 'number'
    );
  }
}
