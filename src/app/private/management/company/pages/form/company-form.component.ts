import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CompanyService } from '../../services/company.service';
import { Company } from '../../models/company.model';
import { MessageService } from 'primeng/api';
import { COMPANY_ID } from '../../../../../utils/constants';

@Component({
  selector: 'app-company-form',
  templateUrl: './company-form.component.html',
  styleUrl: './company-form.component.scss',
  providers: [MessageService],
})
export class CompanyFormComponent implements OnInit {
  companyId: number = COMPANY_ID;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly companyService: CompanyService,
    private readonly messageService: MessageService,
  ) {}

  form: FormGroup = this.formBuilder.group({
    businessName: ['', Validators.required],
    representativeLegal: ['', Validators.required],
    address: ['', Validators.required],
    phoneNumber: ['', Validators.required],
    email: ['', Validators.required],
    googleMapsLocation: ['', Validators.required],
  });

  ngOnInit(): void {
    this.companyService.getOne(this.companyId).subscribe((company: Company) => {
      this.form.patchValue(company);
    });
  }

  buttonUpdateCompany(): void {
    if (this.form) {
      const company = new Company(this.form.value);
      this.companyService.edit(this.companyId, company).subscribe({
        next: () => {
          this.showSuccess('Tus datos han sido actualizado.');
        },
        error: () => {
          this.showSuccess('Ha ocurrido un error. Revise!');
        },
      });
    }
  }

  showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Confirmado',
      detail: message,
      life: 3000,
    });
  }

  showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 3000,
    });
  }
}
