import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';

@Component({
  selector: 'app-input-date',
  templateUrl: './input-date.component.html',
  styleUrl: './input-date.component.scss',
  standalone: true,
  imports: [CalendarModule, FormsModule, ReactiveFormsModule],
})
export class InputDateComponent implements OnInit {
  @Input() showIcon: boolean = true;
  @Input() placeholder: string = 'placeholder';
  @Input() label: string = 'Input date';
  @Input() formGroup?: FormGroup<any>;
  @Input() controlName: string = 'text';
  id: string = '';

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
