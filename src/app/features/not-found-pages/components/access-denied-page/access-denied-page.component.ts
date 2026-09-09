import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';

@Component({
  selector: 'app-access-denied-page',
  imports: [ButtonComponent],
  templateUrl: './access-denied-page.component.html',
  styleUrl: './access-denied-page.component.scss',
})
export class AccessDeniedPageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly reason = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('reason'))),
    { initialValue: null },
  );

  protected readonly message = computed(() => {
    if (this.reason() === 'role') {
      return 'Tu rol no tiene acceso a esta sección. Si crees que es un error, contacta a un administrador.';
    }

    return 'No tienes permiso para acceder a esta sección. Si crees que es un error, contacta a un administrador.';
  });

  protected goHome(): void {
    void this.router.navigate(['/dashboard']);
  }
}
