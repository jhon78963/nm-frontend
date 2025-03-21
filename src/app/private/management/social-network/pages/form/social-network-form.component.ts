import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SocialNetworkService } from '../../services/social-network.service';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SocialNetwork } from '../../models/social-network.model';
import { COMPANY_ID } from '../../../../../utils/constants';

@Component({
  selector: 'app-social-network-form',
  templateUrl: './social-network-form.component.html',
  styleUrl: './social-network-form.component.scss',
})
export class SocialNetworkFormComponent implements OnInit {
  companyId: number = COMPANY_ID;
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly socialNetworkService: SocialNetworkService,
    private readonly dialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
  ) {}

  form: FormGroup = this.formBuilder.group({
    name: ['', Validators.required],
    icon: ['', Validators.required],
    url: ['', Validators.required],
  });

  ngOnInit(): void {
    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.socialNetworkService
        .getOne(id)
        .subscribe((response: SocialNetwork) => {
          this.form.patchValue(response);
        });
    }
  }

  buttonSaveSocialNetwork() {
    if (this.form) {
      const socialNetwork = new SocialNetwork(this.form.value);
      socialNetwork.companyId = this.companyId;
      if (this.dynamicDialogConfig.data.id) {
        const id = this.dynamicDialogConfig.data.id;
        this.socialNetworkService.edit(id, socialNetwork).subscribe({
          next: () => this.dialogRef.close(),
          error: () => this.dialogRef.close(),
        });
      } else {
        this.socialNetworkService.create(socialNetwork).subscribe({
          next: () => this.dialogRef.close(),
          error: () => this.dialogRef.close(),
        });
      }
    }
  }
}
