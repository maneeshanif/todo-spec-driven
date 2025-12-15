declare module '@sentry/nextjs' {
  export function init(options: {
    dsn: string | undefined;
    environment?: string;
    tracesSampleRate?: number;
    replaysSessionSampleRate?: number;
    replaysOnErrorSampleRate?: number;
  }): void;

  export function captureException(error: Error): void;
  export function captureMessage(message: string, level?: string): void;
  export function setUser(user: { id: string; email?: string; name?: string } | null): void;
  export function addBreadcrumb(breadcrumb: {
    message: string;
    category: string;
    data?: any;
    level?: string;
  }): void;

  export function withScope(callback: (scope: Scope) => void): void;

  export interface Scope {
    setExtra(key: string, value: any): void;
  }
}
