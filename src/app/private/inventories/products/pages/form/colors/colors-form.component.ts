import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-colors-form',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './colors-form.component.html',
  styleUrl: './colors-form.component.scss',
})
export class ColorsFormComponent {
  selectedColors: any[] = [];
  createColor() {}
  saveAllSelectedColors() {}
  deleteAllSelectedColors() {}
}
