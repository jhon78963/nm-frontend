import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-input-number',
  templateUrl: './input-number.component.html',
  styleUrl: './input-number.component.scss',
  standalone: true,
  imports: [InputNumberModule, FormsModule, ReactiveFormsModule],
})
export class InputNumberComponent implements OnInit {
  @Input() label: string = 'number';
  @Input() placeholder: string = 'placeholder';
  @Input() showButtons: boolean = true;
  @Input() controlName: string = 'text';
  @Input() formGroup?: FormGroup<any>;

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
