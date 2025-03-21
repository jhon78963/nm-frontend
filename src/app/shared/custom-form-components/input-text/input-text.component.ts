import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-input-text',
  templateUrl: './input-text.component.html',
  styleUrl: './input-text.component.scss',
  standalone: true,
  imports: [InputTextModule, FormsModule, ReactiveFormsModule],
})
export class InputTextComponent implements OnInit {
  @Input() placeholder: string = '';
  @Input() label: string = '';
  @Input() for: string = '';
  @Input() type: string = '';
  @Input() id: string = '';
  @Input() controlName: string = 'text';
  @Input() readonly: boolean = false;
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
