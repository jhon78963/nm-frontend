import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';
import { PosFooterComponent } from '../components/pos-footer/pos-footer.component';
import { PosHeaderComponent } from '../components/pos-header/pos-header.component';
import { PosSelectorComponent } from '../components/pos-selector/pos-selector.component';
import { PosService } from '../services/pos.service';

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
export class PosComponent implements AfterViewChecked, OnInit {
  posService = inject(PosService);
  private readonly destroyRef = inject(DestroyRef);

  barcodeQuery = '';
  @ViewChild('barcodeInput') barcodeInput!: ElementRef;

  private barcodeSubject = new Subject<string>();

  ngOnInit() {
    this.barcodeSubject
      .pipe(
        debounceTime(300),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(valor => {
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

}
