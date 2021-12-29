/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/cloudflare-workers/globals" />

export {};

interface Env {
  NODE_ENV: string;
  VERSION: string;
}

declare global {
  const process: { env: Partial<Env> };
}
