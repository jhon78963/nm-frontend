import {
  AfterViewChecked,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { PosHeaderComponent } from '../components/pos-header/pos-header.component';
import { PosFooterComponent } from '../components/pos-footer/pos-footer.component';
import { PosService } from '../services/pos.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PosSelectorComponent } from '../components/pos-selector/pos-selector.component';
import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  Subscription,
} from 'rxjs';

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
export class PosComponent implements AfterViewChecked, OnInit, OnDestroy {
  posService = inject(PosService);

  barcodeQuery = '';
  @ViewChild('barcodeInput') barcodeInput!: ElementRef;

  private barcodeSubject = new Subject<string>();
  private barcodeSubscription?: Subscription;

  ngOnInit() {
    // 2. Nos suscribimos con un retraso (debounce)
    this.barcodeSubscription = this.barcodeSubject
      .pipe(
        debounceTime(300), // Espera 300ms después de la última tecla
        distinctUntilChanged(), // Evita disparar si el valor es el mismo
      )
      .subscribe(valor => {
        // Si el valor no está vacío, buscamos
        if (valor) {
          this.onScan();
        }
      });
  }

  async onScan() {
    const code = this.barcodeQuery.trim();
    if (!code) return;
    const prod = await this.posService.searchProductBySku(code);
    if (prod) {
      this.posService.openAddModal(prod);
      this.barcodeQuery = '';
    } else {
      this.barcodeQuery = ''; // Toast manejado en servicio
    }
  }

  onQueryChange(valor: string) {
    this.barcodeSubject.next(valor);
  }

  ngAfterViewChecked() {
    if (!this.posService.modalState().isOpen && this.barcodeInput) {
      // this.barcodeInput.nativeElement.focus();
    }
  }

  ngOnDestroy() {
    // Importante desuscribirse para evitar fugas de memoria
    if (this.barcodeSubscription) {
      this.barcodeSubscription.unsubscribe();
    }
  }
}
