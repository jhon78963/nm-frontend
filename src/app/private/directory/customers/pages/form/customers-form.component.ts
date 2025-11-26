import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Customer } from '../../models/customers.model';
import { CustomersService } from '../../services/customers.service';

@Component({
  selector: 'app-customers-form',
  templateUrl: './customers-form.component.html',
  styleUrl: './customers-form.component.scss',
})
export class CustomerFormComponent implements OnInit {
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly customersService: CustomersService,
    private readonly dynamicDialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
  ) {}

  form: FormGroup = this.formBuilder.group({
    dni: ['', Validators.required],
    name: ['', Validators.required],
    surname: ['', Validators.required],
  });

  ngOnInit(): void {
    this.customersService.callGetList().subscribe();
    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.customersService.getOne(id).subscribe((response: Customer) => {
        this.form.patchValue(response);
      });
    }
  }

  get isValid(): boolean {
    return this.form.valid;
  }

  buttonSaveUser(): void {
    const customer = new Customer(this.form.value);
    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.customersService.edit(id, customer).subscribe({
        next: () => this.dynamicDialogRef.close({ success: true }),
        error: () => {},
      });
    } else {
      this.customersService.create(customer).subscribe({
        next: () => {
          this.dynamicDialogRef.close({ success: true });
          this.form.reset();
        },
        error: () => {},
      });
    }
  }
}
