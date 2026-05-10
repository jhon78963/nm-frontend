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
import { FeatureLockComponent } from '../components/feature-lock/feature-lock.component';

/**
 * Structural directive that renders the host content when the tenant
 * has the commercial feature active, or replaces it with a
 * FeatureLockComponent (lock icon + upgrade dialog) when it is not.
 *
 * Usage:
 *   <section *hasFeature="'electronic_billing'">
 *     <!-- billing UI -->
 *   </section>
 *
 * When the feature is inactive the section is replaced by a lock badge.
 * Clicking the badge opens a "Mejora tu plan" dialog.
 */
@Directive({
  selector: '[hasFeature]',
  standalone: true,
})
export class HasFeatureDirective implements OnInit, OnDestroy {
  @Input() hasFeature = '';

  private subscription?: Subscription;

  constructor(
    private readonly templateRef: TemplateRef<unknown>,
    private readonly viewContainer: ViewContainerRef,
    private readonly permissionsService: PermissionsService,
  ) {}

  ngOnInit(): void {
    this.subscription = this.permissionsService.features$.subscribe(() =>
      this.syncView(),
    );
  }

  private syncView(): void {
    this.viewContainer.clear();

    if (this.permissionsService.hasFeature(this.hasFeature)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      const lockRef =
        this.viewContainer.createComponent(FeatureLockComponent);
      lockRef.instance.featureName = this.hasFeature;
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
