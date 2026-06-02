import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { debounceTime, Subject } from 'rxjs';
import { AuthService } from '../../../../../auth/services/auth.service';
import { userRequiresWarehouseAssignment } from '../../../../../auth/utils/warehouse-access.util';
import { showToastWarn } from '../../../../../utils/notifications';
import { PosFooterComponent } from '../components/pos-footer/pos-footer.component';
import { PosHeaderComponent } from '../components/pos-header/pos-header.component';
import { PosSelectorComponent } from '../components/pos-selector/pos-selector.component';
import { PrintReceiptComponent } from '../components/print-receipt/print-receipt.component';
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
    PrintReceiptComponent,
  ],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.scss',
})
export class PosComponent implements AfterViewChecked, OnDestroy, OnInit {
  posService = inject(PosService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messageService = inject(MessageService);

  hasNoWarehouse = false;
  barcodeQuery = '';
  @ViewChild('barcodeInput') barcodeInput!: ElementRef;

  private barcodeSubject = new Subject<string>();

  ngOnInit() {
    this.applyWarehouseGate(this.authService.currentUser());

    this.authService
      .ensureSessionLoaded()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.applyWarehouseGate(user);
      });

    this.barcodeSubject
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(valor => {
        if (valor && !this.hasNoWarehouse) {
          this.onScan();
        }
      });
  }

  private applyWarehouseGate(
    user: ReturnType<AuthService['currentUser']>,
  ): void {
    const shouldBlock = userRequiresWarehouseAssignment(user);
    if (!shouldBlock) {
      this.hasNoWarehouse = false;
      return;
    }

    if (this.hasNoWarehouse) {
      return;
    }

    this.hasNoWarehouse = true;
    showToastWarn(
      this.messageService,
      'Atención: Tu usuario no tiene un almacén asignado. No podrás buscar productos ni registrar ventas. Contacta al administrador.',
    );
  }

  async onScan() {
    if (this.hasNoWarehouse) {
      return;
    }
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
    if (this.hasNoWarehouse) {
      return;
    }
    this.barcodeSubject.next(valor);
  }

  ngAfterViewChecked() {
    if (!this.posService.modalState().isOpen && this.barcodeInput) {
      // this.barcodeInput.nativeElement.focus();
    }
  }

  ngOnDestroy(): void {
    this.posService.clearCart();
  }
}
