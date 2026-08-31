import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideLock,
  lucideMail,
  lucideUser,
  lucideArrowRight,
  lucideSparkles,
  lucideX,
  lucideShieldCheck,
  lucideLogIn,
  lucideUserPlus,
} from '@ng-icons/lucide';
import { AuthStore } from '../../core/state/auth.store';
import { DocumentStore } from '../../core/state/document.store';

type AuthTab = 'signin' | 'register' | 'guest';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent],
  viewProviders: [
    provideIcons({
      lucideLock,
      lucideMail,
      lucideUser,
      lucideArrowRight,
      lucideSparkles,
      lucideX,
      lucideShieldCheck,
      lucideLogIn,
      lucideUserPlus,
    }),
  ],
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.css'],
})
export class AuthModalComponent {
  authStore = inject(AuthStore);
  documentStore = inject(DocumentStore);

  activeTab = signal<AuthTab>('signin');
  email = signal<string>('');
  password = signal<string>('');
  confirmPassword = signal<string>('');
  validationError = signal<string | null>(null);

  setTab(tab: AuthTab) {
    this.activeTab.set(tab);
    this.validationError.set(null);
    this.authStore.error.set(null);
  }

  close() {
    this.authStore.closeAuthModal();
  }

  onBackdropClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('auth-backdrop')) {
      this.close();
    }
  }

  async onSubmit() {
    this.validationError.set(null);
    const emailVal = this.email().trim();
    const passVal = this.password();

    if (this.activeTab() === 'guest') {
      await this.authStore.continueAsGuest();
      this.documentStore.loadInitialData();
      return;
    }

    if (!emailVal) {
      this.validationError.set('Please enter your email address.');
      return;
    }

    if (!passVal) {
      this.validationError.set('Please enter your password.');
      return;
    }

    if (this.activeTab() === 'register') {
      if (passVal.length < 6) {
        this.validationError.set('Password must be at least 6 characters.');
        return;
      }
      if (passVal !== this.confirmPassword()) {
        this.validationError.set('Passwords do not match.');
        return;
      }

      const success = await this.authStore.register(emailVal, passVal);
      if (success) {
        this.documentStore.loadInitialData();
      }
    } else if (this.activeTab() === 'signin') {
      const success = await this.authStore.login(emailVal, passVal);
      if (success) {
        this.documentStore.loadInitialData();
      }
    }
  }

  async onGuestSubmit() {
    await this.authStore.continueAsGuest();
    this.documentStore.loadInitialData();
  }
}
