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
import { MessageService } from 'primeng/api';
import { debounceTime, Subject } from 'rxjs';
import { User } from '../../../../../auth/interfaces/user.interface';
import { showToastWarn } from '../../../../../utils/notifications';
import { PosFooterComponent } from '../components/pos-footer/pos-footer.component';
import { PosHeaderComponent } from '../components/pos-header/pos-header.component';
import { PosSelectorComponent } from '../components/pos-selector/pos-selector.component';
import { PosService } from '../services/pos.service';

type StoredUser = User & { warehouse_id?: number | null };

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
  private readonly messageService = inject(MessageService);

  hasNoWarehouse = false;
  barcodeQuery = '';
  @ViewChild('barcodeInput') barcodeInput!: ElementRef;

  private barcodeSubject = new Subject<string>();

  ngOnInit() {
    this.checkWarehouseAssignment();

    this.barcodeSubject
      .pipe(
        debounceTime(300),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(valor => {
        if (valor && !this.hasNoWarehouse) {
          this.onScan();
        }
      });
  }

  private checkWarehouseAssignment(): void {
    const user = this.readLoggedUser();
    if (!user) {
      return;
    }

    if (!this.isSuperAdmin(user) && this.isWarehouseMissing(user)) {
      this.hasNoWarehouse = true;
      showToastWarn(
        this.messageService,
        'Atención: Tu usuario no tiene un almacén asignado. No podrás buscar productos ni registrar ventas. Contacta al administrador.',
      );
    }
  }

  private readLoggedUser(): StoredUser | undefined {
    const raw = localStorage.getItem('user');
    if (!raw) {
      return undefined;
    }
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return undefined;
    }
  }

  private isSuperAdmin(user: StoredUser): boolean {
    if (user.role === 'Super Admin') {
      return true;
    }
    return user.roles?.includes('Super Admin') ?? false;
  }

  private isWarehouseMissing(user: StoredUser): boolean {
    const warehouseId = user.warehouseId ?? user.warehouse_id;
    return warehouseId == null || warehouseId === 0;
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

}
