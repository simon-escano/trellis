import { Injectable, computed, inject, signal } from '@angular/core';
import { GraphQLService } from '../services/graphql.service';
import { User } from '../models/user.model';

const TOKEN_KEY = 'trellis_token';

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private graphql = inject(GraphQLService);

  readonly currentUser = signal<User | null>(null);
  readonly token = signal<string | null>(null);
  readonly isAuthModalOpen = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly isAuthenticated = computed(() => {
    const user = this.currentUser();
    return !!user && !user.isGuest;
  });

  readonly isGuest = computed(() => {
    const user = this.currentUser();
    return !user || user.isGuest;
  });

  readonly userInitial = computed(() => {
    const user = this.currentUser();
    if (!user || user.isGuest || !user.email) return 'G';
    return user.email.charAt(0).toUpperCase();
  });

  constructor() {
    this.initAuth();
  }

  async initAuth(): Promise<void> {
    if (typeof window === 'undefined') return;

    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      // Default to unauthenticated/guest
      this.currentUser.set({
        id: 'guest',
        email: 'guest@trellis.local',
        createdAt: new Date().toISOString(),
        isGuest: true,
      });
      return;
    }

    this.token.set(storedToken);
    try {
      const user = await this.graphql.getMe();
      if (user) {
        this.currentUser.set(user);
      } else {
        // Stale or invalid token
        localStorage.removeItem(TOKEN_KEY);
        this.token.set(null);
        this.currentUser.set({
          id: 'guest',
          email: 'guest@trellis.local',
          createdAt: new Date().toISOString(),
          isGuest: true,
        });
      }
    } catch {
      this.currentUser.set({
        id: 'guest',
        email: 'guest@trellis.local',
        createdAt: new Date().toISOString(),
        isGuest: true,
      });
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const payload = await this.graphql.login({ email, password });
      this.setAuthSession(payload.token, payload.user);
      this.closeAuthModal();
      return true;
    } catch (err: any) {
      const msg = err?.message || 'Login failed. Please check your credentials.';
      this.error.set(msg.replace('ApolloError: ', ''));
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  async register(email: string, password: string): Promise<boolean> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const payload = await this.graphql.register({ email, password });
      this.setAuthSession(payload.token, payload.user);
      this.closeAuthModal();
      return true;
    } catch (err: any) {
      const msg = err?.message || 'Registration failed. Please try again.';
      this.error.set(msg.replace('ApolloError: ', ''));
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  async continueAsGuest(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const payload = await this.graphql.createGuestSession();
      this.setAuthSession(payload.token, payload.user);
    } catch {
      // Fallback local guest
      localStorage.removeItem(TOKEN_KEY);
      this.token.set(null);
      this.currentUser.set({
        id: 'guest',
        email: 'guest@trellis.local',
        createdAt: new Date().toISOString(),
        isGuest: true,
      });
    } finally {
      this.loading.set(false);
      this.closeAuthModal();
    }
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
    this.token.set(null);
    this.currentUser.set({
      id: 'guest',
      email: 'guest@trellis.local',
      createdAt: new Date().toISOString(),
      isGuest: true,
    });
  }

  openAuthModal(): void {
    this.error.set(null);
    this.isAuthModalOpen.set(true);
  }

  closeAuthModal(): void {
    this.error.set(null);
    this.isAuthModalOpen.set(false);
  }

  private setAuthSession(token: string, user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
    this.token.set(token);
    this.currentUser.set(user);
  }
}
