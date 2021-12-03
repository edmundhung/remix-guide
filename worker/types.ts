import type { Auth } from './auth';
import type { Store } from './store';

export type { UserProfile } from './auth';
export type { Entry } from './store';

export interface Context {
  auth: Auth;
  store: Store;
}
