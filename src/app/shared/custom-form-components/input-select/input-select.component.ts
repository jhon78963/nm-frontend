import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';

@Component({
  selector: 'app-input-select',
  templateUrl: './input-select.component.html',
  styleUrl: './input-select.component.scss',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, DropdownModule],
})
export class InputSelectComponent implements OnInit {
  @Input() label: string = '';
  @Input() for: string = '';
  @Input() options: any[] = [];
  @Input() id: string = '';
  @Input() controlName: string = 'select';
  @Input() optionLabel: any;
  @Input() placeholder: string = '';
  @Input() optionValue: any;
  @Input() showClear: boolean = false;
  @Input() formGroup?: FormGroup<any>;
  selectedValue: any;

  formControl!: FormControl;
  submitted!: boolean;

  constructor(private formGroupDirective: FormGroupDirective) {}

  ngOnInit(): void {
    this.formGroupDirective.ngSubmit.subscribe({
      next: (value: any) => {
        this.submitted = value.isTrusted;
      },
    });
    this.formGroup = this.formGroupDirective.form;
    this.formControl = this.formGroup.get(this.controlName) as FormControl;
  }
}
