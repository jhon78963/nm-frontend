import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../interfaces';

/**
 * Single source of truth for the authenticated user's identity,
 * permission strings and active commercial feature flags.
 *
 * Guards and directives consume this service so they never need
 * to re-call the API after the initial bootstrap.
 */
@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly _user$ = new BehaviorSubject<User | null>(null);
  private readonly _permissions$ = new BehaviorSubject<string[]>([]);
  private readonly _features$ = new BehaviorSubject<string[]>([]);

  readonly user$ = this._user$.asObservable();
  readonly permissions$ = this._permissions$.asObservable();
  readonly features$ = this._features$.asObservable();

  setUser(user: User): void {
    this._user$.next(user);
    this._permissions$.next(user.permissions ?? []);
    this._features$.next(user.features ?? []);
  }

  getUser(): User | null {
    return this._user$.getValue();
  }

  /** Returns true when the exact permission string is present. */
  hasPermission(permission: string): boolean {
    return this._permissions$.getValue().includes(permission);
  }

  /** Returns true when the commercial feature is active for this tenant. */
  hasFeature(feature: string): boolean {
    return this._features$.getValue().includes(feature);
  }

  /** System-admin tenants have tenantId === 1 (the SaaS provider itself). */
  isSystemAdmin(): boolean {
    return this._user$.getValue()?.tenantId === 1;
  }

  clear(): void {
    this._user$.next(null);
    this._permissions$.next([]);
    this._features$.next([]);
  }
}
