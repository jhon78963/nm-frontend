import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-input-textarea',
  templateUrl: './input-textarea.component.html',
  styleUrl: './input-textarea.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    InputTextareaModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class InputTextareaComponent implements OnInit, OnDestroy {
  @Input() placeholder: string = '';
  @Input() rows: number = 3;
  @Input() cols: number = 30;
  @Input() label: string = '';
  @Input() controlName: string = 'text';
  @Input() readonly: boolean = false;
  @Input() formGroup?: FormGroup<any>;

  formControl!: FormControl;
  submitted!: boolean;

  // Estado para estilos visuales
  isFocused: boolean = false;

  private sub: Subscription = new Subscription();

  constructor(private formGroupDirective: FormGroupDirective) {}

  ngOnInit(): void {
    this.formGroup = this.formGroupDirective.form;
    this.formControl = this.formGroup.get(this.controlName) as FormControl;

    const submitSub = this.formGroupDirective.ngSubmit.subscribe(
      (value: any) => {
        this.submitted = value.isTrusted;
      },
    );
    this.sub.add(submitSub);
  }

  onFocus() {
    this.isFocused = true;
  }

  onBlur() {
    this.isFocused = false;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
