import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputNumberModule } from 'primeng/inputnumber';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-input-money',
  templateUrl: './input-money.component.html',
  styleUrl: './input-money.component.scss',
  standalone: true,
  imports: [CommonModule, InputNumberModule, FormsModule, ReactiveFormsModule],
})
export class InputMoneyComponent implements OnInit, OnDestroy {
  @Input() label: string = '';
  @Input() controlName: string = 'money'; // Nombre por defecto
  @Input() readonly: boolean = false;
  @Input() formGroup?: FormGroup<any>;

  formControl!: FormControl;
  submitted!: boolean;

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
