import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppLayoutModule } from './layout/app.layout.module';
import { ProgressSpinnerService } from './services/progress-spinner.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    AppLayoutModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly progressSpinnerService = inject(ProgressSpinnerService);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.authService.loadSessionFromApi();
  }

  get showSpinner(): Observable<boolean> {
    return this.progressSpinnerService.loading$;
  }
}
