import {
  AfterViewChecked,
  Component,
  ElementRef,
  inject,
  ViewChild,
} from '@angular/core';
import { PosHeaderComponent } from '../components/pos-header/pos-header.component';
import { PosFooterComponent } from '../components/pos-footer/pos-footer.component';
import { PosSelectorComponent } from '../components/pos-selector/pos-selector.component';
import { PosService } from '../services/pos.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PosHeaderComponent,
    PosFooterComponent,
    PosSelectorComponent,
  ],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.scss',
})
export class PosComponent implements AfterViewChecked {
  posService = inject(PosService);

  barcodeQuery = '';
  @ViewChild('barcodeInput') barcodeInput!: ElementRef;

  onScan() {
    const code = this.barcodeQuery.trim();
    if (!code) return;

    const prod = this.posService.searchProductBySku(code);
    if (prod) {
      this.posService.openAddModal(prod);
      this.barcodeQuery = '';
    } else {
      this.posService.showToast(`Código ${code} no existe`);
      this.barcodeQuery = '';
    }
  }

  ngAfterViewChecked() {
    if (!this.posService.modalState().isOpen && this.barcodeInput) {
      // this.barcodeInput.nativeElement.focus();
    }
  }
}
