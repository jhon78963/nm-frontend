import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { PosService } from '../../services/pos.service';

@Component({
  selector: 'app-pos-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pos-footer.component.html',
  styleUrl: './pos-footer.component.scss',
})
export class PosFooterComponent {
  posService = inject(PosService);
}
