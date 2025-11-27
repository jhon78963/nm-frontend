import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PosService } from '../../services/pos.service';

@Component({
  selector: 'app-pos-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pos-header.component.html',
  styleUrl: './pos-header.component.scss',
})
export class PosHeaderComponent {
  posService = inject(PosService);
  dniQuery = '';

  search() {
    const found = this.posService.searchCustomerByDni(this.dniQuery);
    if (!found) this.dniQuery = ''; // Opcional: limpiar si falla
  }

  reset() {
    this.posService.currentCustomer.set(null);
    this.dniQuery = '';
  }
}
