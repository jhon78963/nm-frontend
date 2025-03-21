import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { KeyFilterModule } from 'primeng/keyfilter';
import { SharedModule } from '../../../../../shared/shared.module';
import { Inventory } from '../../models/inventory.model';
import { InventoriesService } from '../../services/inventories.service';

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [CommonModule, KeyFilterModule, ReactiveFormsModule, SharedModule],
  templateUrl: './inventory-form.component.html',
  styleUrl: './inventory-form.component.scss',
})
export class InventoryFormComponent implements OnInit {
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
    private readonly dynamicDialogRef: DynamicDialogRef,
    private readonly inventoriesService: InventoriesService,
  ) {}

  form: FormGroup = this.formBuilder.group({
    description: [null, Validators.required],
    stock: [null, Validators.required],
    stockInUse: [0, Validators.required],
  });

  ngOnInit(): void {
    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.inventoriesService.get(id).subscribe({
        next: (inventory: Inventory) => {
          this.form.patchValue(inventory);
        },
      });
    }
  }

  inventoriesSaveButton() {
    const id = this.dynamicDialogConfig.data.id;
    const inventory = new Inventory(this.form.value);
    if (id) {
      this.inventoriesService.update(id, inventory).subscribe({
        next: () => {
          this.dynamicDialogRef.close({ success: true });
        },
      });
    } else {
      this.inventoriesService.create(inventory).subscribe({
        next: () => {
          this.dynamicDialogRef.close({ success: true });
        },
      });
    }
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }
}
