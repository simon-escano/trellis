import { Injectable, ApplicationRef, ComponentRef, createComponent, EnvironmentInjector, signal } from '@angular/core';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component.js';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private componentRef: ComponentRef<ConfirmDialogComponent> | null = null;

  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector,
  ) {}

  confirm(options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
  }): Promise<boolean> {
    return new Promise((resolve) => {
      this.componentRef = createComponent(ConfirmDialogComponent, {
        environmentInjector: this.injector,
      });

      const instance = this.componentRef.instance;
      instance.title = options.title;
      instance.message = options.message;
      instance.confirmLabel = options.confirmLabel ?? 'Confirm';
      instance.cancelLabel = options.cancelLabel ?? 'Cancel';
      instance.danger = options.danger ?? false;

      instance.confirmed.subscribe(() => {
        resolve(true);
        this.destroy();
      });

      instance.cancelled.subscribe(() => {
        resolve(false);
        this.destroy();
      });

      this.appRef.attachView(this.componentRef.hostView);
      const domElem = (this.componentRef.hostView as any).rootNodes[0] as HTMLElement;
      document.body.appendChild(domElem);
      this.componentRef.changeDetectorRef.detectChanges();
    });
  }

  private destroy() {
    if (this.componentRef) {
      this.appRef.detachView(this.componentRef.hostView);
      this.componentRef.destroy();
      this.componentRef = null;
    }
  }
}
