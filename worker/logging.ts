import type { Env } from './types';
import type { Reporter, Tracker } from 'workers-logger';
import { track, enable } from 'workers-logger';
import { defaultReporter } from 'diary';
import Toucan from 'toucan-js';

function createReporter(
  request: Request,
  env: Env,
  ctx?: ExecutionContext
): Reporter {
  if (!env.SENTRY_DSN) {
    return (events) => {
      for (const event of events) {
        defaultReporter(event);
      }
    };
  }

  const options = {
    dsn: env.SENTRY_DSN,
    request,
  };

  if (ctx) {
    options.context = ctx;
  }

  const Sentry = new Toucan(options);

  return (events) => {
    for (const event of events) {
      switch (event.level) {
        case 'error':
        case 'fatal':
          Sentry.captureException(event.error);
          break;
        case 'info':
        case 'warn':
        case 'log':
          Sentry.captureMessage(event.message, event.level);
          break;
      }
    }
  };
}

function createLogger(
  request: Request,
  env: Env,
  ctx?: ExecutionContext
): Tracker {
  const reporter = createReporter(request, env, ctx);
  const logger = track(request, env.LOGGER_NAME, reporter);

  enable(env.DEBUG ?? '*');

  return logger;
}

export { createLogger };
