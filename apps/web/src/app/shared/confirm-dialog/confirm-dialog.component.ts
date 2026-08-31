import { Component, EventEmitter, Input, Output, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      [class.anim-backdrop-in]="visible"
      style="background: rgba(0,0,0,0.45); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);"
      (click)="onCancel()"
    >
      <!-- Modal Panel -->
      <div
        class="confirm-dialog-panel relative w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4"
        [class.anim-modal-in]="visible"
        [class.danger]="danger"
        (click)="$event.stopPropagation()"
      >
        <!-- Icon -->
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

        <!-- Message -->
        <p class="confirm-message text-sm leading-relaxed pl-[52px] -mt-2">{{ message }}</p>

        <!-- Actions -->
        <div class="flex items-center gap-2 justify-end pt-1">
          <button
            (click)="onCancel()"
            class="confirm-btn-cancel h-9 px-4 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer"
          >{{ cancelLabel }}</button>
          <button
            (click)="onConfirm()"
            class="confirm-btn-ok h-9 px-4 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer"
            [class.btn-danger]="danger"
            [class.btn-neutral]="!danger"
          >{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }

    /* Backdrop animation */
    @keyframes backdropIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    .anim-backdrop-in {
      animation: backdropIn 0.18s ease forwards;
    }

    /* Modal panel animation */
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.92) translateY(10px); }
      to   { opacity: 1; transform: scale(1)    translateY(0); }
    }
    .anim-modal-in {
      animation: modalIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    /* Glass panel */
    :host-context(html.dark) .confirm-dialog-panel {
      background: rgba(15, 20, 30, 0.82);
      backdrop-filter: blur(32px) saturate(200%);
      -webkit-backdrop-filter: blur(32px) saturate(200%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12);
      color: #F8FAFC;
    }
    :host-context(html.light) .confirm-dialog-panel,
    .confirm-dialog-panel {
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(32px) saturate(200%);
      -webkit-backdrop-filter: blur(32px) saturate(200%);
      border: 1px solid rgba(0,0,0,0.08);
      box-shadow: 0 24px 60px rgba(15,23,42,0.14), inset 0 1px 0 rgba(255,255,255,1);
      color: #0F172A;
    }

    /* Icon areas */
    :host-context(html.dark) .icon-danger {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239,68,68,0.25);
    }
    :host-context(html.light) .icon-danger,
    .icon-danger {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
      border: 1px solid rgba(239,68,68,0.2);
    }
    :host-context(html.dark) .icon-neutral {
      background: rgba(99, 102, 241, 0.15);
      color: #a5b4fc;
      border: 1px solid rgba(99,102,241,0.25);
    }
    :host-context(html.light) .icon-neutral,
    .icon-neutral {
      background: rgba(99, 102, 241, 0.1);
      color: #6366f1;
      border: 1px solid rgba(99,102,241,0.2);
    }

    /* Message text */
    :host-context(html.dark) .confirm-message { color: rgba(248,250,252,0.65); }
    :host-context(html.light) .confirm-message,
    .confirm-message { color: rgba(15,23,42,0.6); }

    /* Cancel button */
    :host-context(html.dark) .confirm-btn-cancel {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.09);
      color: rgba(248,250,252,0.75);
    }
    :host-context(html.dark) .confirm-btn-cancel:hover {
      background: rgba(255,255,255,0.11);
      color: #fff;
    }
    :host-context(html.light) .confirm-btn-cancel,
    .confirm-btn-cancel {
      background: rgba(0,0,0,0.04);
      border: 1px solid rgba(0,0,0,0.09);
      color: #475569;
    }
    :host-context(html.light) .confirm-btn-cancel:hover,
    .confirm-btn-cancel:hover {
      background: rgba(0,0,0,0.08);
      color: #0f172a;
    }

    /* Danger confirm button */
    .btn-danger {
      background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
      color: #fff;
      box-shadow: 0 4px 14px rgba(239,68,68,0.35);
    }
    .btn-danger:hover {
      background: linear-gradient(180deg, #f87171 0%, #ef4444 100%);
      box-shadow: 0 6px 18px rgba(239,68,68,0.45);
    }

    /* Neutral confirm button */
    .btn-neutral {
      background: linear-gradient(180deg, #00F5A0 0%, #00D287 100%);
      color: #052e16;
      box-shadow: 0 4px 14px rgba(0,245,160,0.3);
    }
    .btn-neutral:hover {
      box-shadow: 0 6px 18px rgba(0,245,160,0.4);
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

  visible = false;

  ngOnInit() {
    // Trigger animation on next tick
    requestAnimationFrame(() => { this.visible = true; });
  }

  onConfirm() { this.confirmed.emit(); }
  onCancel()  { this.cancelled.emit(); }
}
