import * as Sentry from '@sentry/angular';

import { environment } from '../../../environments/environment';

function parseSampleRate(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return fallback;
  }

  return parsed;
}

export function initSentry(): void {
  if (!environment.sentryDsn?.trim()) {
    return;
  }

  Sentry.init({
    dsn: environment.sentryDsn,
    environment: environment.production ? 'production' : 'development',
    release: environment.sentryRelease,
    tracesSampleRate: parseSampleRate(environment.sentryTracesSampleRate, 0.1),
  });
}

export function captureClientException(
  exception: unknown,
  context?: Record<string, string>,
): void {
  if (!environment.sentryDsn?.trim()) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('client', context);
    }

    if (exception instanceof Error) {
      Sentry.captureException(exception);
      return;
    }

    Sentry.captureException(new Error(String(exception)));
  });
}
