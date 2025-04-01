import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { SharedModule } from '../../../../../../shared/shared.module';
import { SizesService } from '../../../../size/services/sizes.service';
import { Observable } from 'rxjs';
import { Size } from '../../../../size/models/sizes.model';
import { AutocompleteResponse } from '../../../../../../shared/models/autocomplete.interface';

@Component({
  selector: 'app-sizes-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModule],
  templateUrl: './sizes-form.component.html',
  styleUrl: './sizes-form.component.scss',
})
export class SizesFormComponent implements OnInit {
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly sizesService: SizesService,
  ) {}

  ngOnInit(): void {
    this.getSizes();
  }

  form: FormGroup = this.formBuilder.group({
    sizeId: [null, Validators.required],
    colors: [null, Validators.required],
  });

  async getSizes() {
    this.sizesService.callGetList().subscribe();
  }

  get sizes(): Observable<Size[]> {
    return this.sizesService.getList();
  }

  getItemSelected(size: AutocompleteResponse) {
    this.form.get('sizeId')?.setValue(size.id);
  }

  getItemsSelected(colors: AutocompleteResponse[]) {
    this.form.get('colors')?.setValue(colors);
  }

  saveSizeButton() {
    console.log(this.form.value);
  }
}
