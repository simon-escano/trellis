import { Component, EventEmitter, Input, Output, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop with smooth fade -->
    <div
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-none"
      [class.backdrop-in]="state() === 'open'"
      [class.backdrop-out]="state() === 'closing'"
      (click)="onCancel()"
    >
      <!-- Modal Panel with smooth glass spring-in -->
      <div
        class="confirm-dialog-panel relative w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4"
        [class.modal-in]="state() === 'open'"
        [class.modal-out]="state() === 'closing'"
        (click)="$event.stopPropagation()"
      >
        <!-- Icon & Title Header -->
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            [class.icon-danger]="danger"
            [class.icon-neutral]="!danger"
          >
            <svg *ngIf="danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
            </svg>
            <svg *ngIf="!danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
            </svg>
          </div>
          <h3 class="confirm-title text-base font-semibold tracking-tight">{{ title }}</h3>
        </div>

        <!-- Descriptive Message -->
        <p class="confirm-message text-sm leading-relaxed pl-[52px] -mt-2">{{ message }}</p>

        <!-- Actions -->
        <div class="flex items-center gap-2.5 justify-end pt-1">
          <button
            (click)="onCancel()"
            class="confirm-btn-cancel h-9 px-4 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
          >{{ cancelLabel }}</button>
          <button
            (click)="onConfirm()"
            class="confirm-btn-ok h-9 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
            [class.btn-danger]="danger"
            [class.btn-neutral]="!danger"
          >{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }

    /* Initial state before animation triggers */
    .fixed {
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      opacity: 0;
      pointer-events: auto;
    }

    .confirm-dialog-panel {
      opacity: 0;
      transform: scale(0.93) translateY(20px);
      filter: blur(3px);
      will-change: transform, opacity, filter;
      transform-origin: center center;
    }

    /* Backdrop smooth transitions */
    @keyframes smoothBackdropIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes smoothBackdropOut {
      from { opacity: 1; }
      to   { opacity: 0; }
    }
    .backdrop-in {
      animation: smoothBackdropIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .backdrop-out {
      animation: smoothBackdropOut 0.22s cubic-bezier(0.4, 0, 1, 1) forwards;
    }

    /* Modal smooth spring-in and graceful exit */
    @keyframes smoothModalIn {
      0% {
        opacity: 0;
        transform: scale(0.93) translateY(20px);
        filter: blur(4px);
      }
      100% {
        opacity: 1;
        transform: scale(1) translateY(0);
        filter: blur(0px);
      }
    }
    @keyframes smoothModalOut {
      0% {
        opacity: 1;
        transform: scale(1) translateY(0);
        filter: blur(0px);
      }
      100% {
        opacity: 0;
        transform: scale(0.95) translateY(12px);
        filter: blur(2px);
      }
    }
    .modal-in {
      animation: smoothModalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .modal-out {
      animation: smoothModalOut 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    /* Apple Glass Card Styling */
    :host-context(html.dark) .confirm-dialog-panel {
      background: rgba(15, 20, 30, 0.82);
      backdrop-filter: blur(32px) saturate(200%);
      -webkit-backdrop-filter: blur(32px) saturate(200%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 32px 80px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.14);
      color: #F8FAFC;
    }
    :host-context(html.light) .confirm-dialog-panel,
    .confirm-dialog-panel {
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(32px) saturate(200%);
      -webkit-backdrop-filter: blur(32px) saturate(200%);
      border: 1px solid rgba(0, 0, 0, 0.08);
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 1);
      color: #0F172A;
    }

    /* Icon Badges */
    :host-context(html.dark) .icon-danger {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.25);
    }
    :host-context(html.light) .icon-danger,
    .icon-danger {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    :host-context(html.dark) .icon-neutral {
      background: rgba(99, 102, 241, 0.15);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.25);
    }
    :host-context(html.light) .icon-neutral,
    .icon-neutral {
      background: rgba(99, 102, 241, 0.1);
      color: #6366f1;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }

    /* Text */
    :host-context(html.dark) .confirm-message { color: rgba(248, 250, 252, 0.65); }
    :host-context(html.light) .confirm-message,
    .confirm-message { color: rgba(15, 23, 42, 0.62); }

    /* Cancel Button */
    :host-context(html.dark) .confirm-btn-cancel {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.09);
      color: rgba(248, 250, 252, 0.75);
    }
    :host-context(html.dark) .confirm-btn-cancel:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
    }
    :host-context(html.light) .confirm-btn-cancel,
    .confirm-btn-cancel {
      background: rgba(0, 0, 0, 0.04);
      border: 1px solid rgba(0, 0, 0, 0.09);
      color: #475569;
    }
    :host-context(html.light) .confirm-btn-cancel:hover {
      background: rgba(0, 0, 0, 0.08);
      color: #0f172a;
    }

    /* Danger Confirm Button */
    .btn-danger {
      background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
      color: #fff;
      box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
    }
    .btn-danger:hover {
      background: linear-gradient(180deg, #f87171 0%, #ef4444 100%);
      box-shadow: 0 6px 18px rgba(239, 68, 68, 0.45);
      transform: scale(1.02);
    }
    .btn-danger:active {
      transform: scale(0.98);
    }

    /* Neutral Confirm Button */
    .btn-neutral {
      background: linear-gradient(180deg, #00F5A0 0%, #00D287 100%);
      color: #052e16;
      box-shadow: 0 4px 14px rgba(0, 245, 160, 0.3);
    }
    .btn-neutral:hover {
      box-shadow: 0 6px 18px rgba(0, 245, 160, 0.4);
      transform: scale(1.02);
    }
    .btn-neutral:active {
      transform: scale(0.98);
    }
  `],
})
export class ConfirmDialogComponent implements OnInit {
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() danger = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly state = signal<'opening' | 'open' | 'closing'>('opening');

  ngOnInit() {
    // Start animation on next frame to ensure clean transition from initial 0 opacity
    requestAnimationFrame(() => {
      this.state.set('open');
    });
  }

  onConfirm() {
    if (this.state() === 'closing') return;
    this.state.set('closing');
    setTimeout(() => {
      this.confirmed.emit();
    }, 220);
  }

  onCancel() {
    if (this.state() === 'closing') return;
    this.state.set('closing');
    setTimeout(() => {
      this.cancelled.emit();
    }, 220);
  }
}
