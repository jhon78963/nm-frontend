import {
  Directive,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { PermissionsService } from '../../auth/services/permissions.service';

/**
 * Structural directive that removes the host element from the DOM
 * when the current user does not hold the required permission.
 *
 * Usage:
 *   <button *hasPermission="'sales.delete'">Eliminar</button>
 *
 * Reacts automatically if the permission set changes during the session
 * (e.g. after a role change without a full page reload).
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  @Input() hasPermission = '';

  private hasView = false;
  private subscription?: Subscription;

  constructor(
    private readonly templateRef: TemplateRef<unknown>,
    private readonly viewContainer: ViewContainerRef,
    private readonly permissionsService: PermissionsService,
  ) {}

  ngOnInit(): void {
    this.subscription = this.permissionsService.permissions$.subscribe(() =>
      this.syncView(),
    );
  }

  private syncView(): void {
    const allowed = this.permissionsService.hasPermission(this.hasPermission);

    if (allowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!allowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
