import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { InputTextareaModule } from 'primeng/inputtextarea';

@Component({
  selector: 'app-input-textarea',
  templateUrl: './input-textarea.component.html',
  styleUrl: './input-textarea.component.scss',
  standalone: true,
  imports: [InputTextareaModule, FormsModule, ReactiveFormsModule],
})
export class InputTextareaComponent implements OnInit {
  @Input() placeholder: string = 'placeholder';
  @Input() rows: number = 3;
  @Input() cols: number = 30;
  @Input() label: string = '';
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
