/**
 * Frontend error tracking and monitoring
 *
 * Provides error tracking integration (Sentry, etc.) for the frontend.
 * Can be configured via environment variables.
 */

interface ErrorContext {
  [key: string]: any;
}

class ErrorTracker {
  private enabled: boolean = false;
  private sentryDsn: string | undefined;

  constructor() {
    this.sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

    if (this.sentryDsn && typeof window !== 'undefined') {
      this.initSentry();
    }
  }

  private initSentry() {
    try {
      // Dynamic import to avoid SSR issues
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.init({
          dsn: this.sentryDsn,
          environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
          tracesSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
          // Session Replay
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,
        });

        this.enabled = true;
        console.log('[Monitoring] Sentry initialized');
      }).catch((error) => {
        console.warn('[Monitoring] Sentry not available:', error.message);
      });
    } catch (error) {
      console.error('[Monitoring] Failed to initialize Sentry:', error);
    }
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: ErrorContext) {
    if (!this.enabled) {
      console.error('[Error]', error, context);
      return;
    }

    import('@sentry/nextjs').then((Sentry) => {
      if (context) {
        Sentry.withScope((scope) => {
          Object.entries(context).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
          Sentry.captureException(error);
        });
      } else {
        Sentry.captureException(error);
      }
    });
  }

  /**
   * Capture a message
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    if (!this.enabled) {
      console[level === 'warning' ? 'warn' : level]('[Message]', message, context);
      return;
    }

    import('@sentry/nextjs').then((Sentry) => {
      if (context) {
        Sentry.withScope((scope) => {
          Object.entries(context).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
          Sentry.captureMessage(message, level);
        });
      } else {
        Sentry.captureMessage(message, level);
      }
    });
  }

  /**
   * Set user context
   */
  setUser(user: { id: string; email?: string; name?: string } | null) {
    if (!this.enabled) return;

    import('@sentry/nextjs').then((Sentry) => {
      Sentry.setUser(user);
    });
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category: string, data?: any) {
    if (!this.enabled) return;

    import('@sentry/nextjs').then((Sentry) => {
      Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
      });
    });
  }
}

// Global instance
export const errorTracker = new ErrorTracker();

/**
 * Log an error with context
 */
export function logError(error: Error, context?: ErrorContext) {
  errorTracker.captureException(error, context);
}

/**
 * Log a message
 */
export function logMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
  errorTracker.captureMessage(message, level, context);
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: { id: string; email?: string; name?: string } | null) {
  errorTracker.setUser(user);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string = 'navigation', data?: any) {
  errorTracker.addBreadcrumb(message, category, data);
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  /**
   * Start measuring an operation
   */
  start(operationName: string) {
    this.marks.set(operationName, performance.now());
  }

  /**
   * End measuring and log the duration
   */
  end(operationName: string, context?: ErrorContext) {
    const startTime = this.marks.get(operationName);
    if (!startTime) {
      console.warn(`[Performance] No start mark found for: ${operationName}`);
      return;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(operationName);

    // Log slow operations (> 1 second)
    if (duration > 1000) {
      logMessage(
        `Slow operation detected: ${operationName}`,
        'warning',
        { duration_ms: duration, ...context }
      );
    }

    return duration;
  }
}

export const performanceMonitor = new PerformanceMonitor();
