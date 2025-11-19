import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-input-text',
  templateUrl: './input-text.component.html',
  styleUrl: './input-text.component.scss',
  standalone: true,
  imports: [CommonModule, InputTextModule, FormsModule, ReactiveFormsModule],
})
export class InputTextComponent implements OnInit, OnDestroy {
  @Input() placeholder: string = ''; // Ahora sí puedes usar placeholder normal si quieres
  @Input() label: string = '';
  @Input() type: string = 'text';
  @Input() id: string = '';
  @Input() controlName: string = 'text';
  @Input() readonly: boolean = false;
  @Input() formGroup?: FormGroup<any>;

  formControl!: FormControl;
  submitted!: boolean;

  // Estado simple para estilo visual
  isFocused: boolean = false;

  private sub: Subscription = new Subscription();

  constructor(private formGroupDirective: FormGroupDirective) {}

  ngOnInit(): void {
    this.formGroup = this.formGroupDirective.form;
    this.formControl = this.formGroup.get(this.controlName) as FormControl;

    // Solo necesitamos escuchar el submit para validaciones
    const submitSub = this.formGroupDirective.ngSubmit.subscribe(
      (value: any) => {
        this.submitted = value.isTrusted;
      },
    );
    this.sub.add(submitSub);
  }

  // Métodos simples para control visual
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
