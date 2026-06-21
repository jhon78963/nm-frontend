import { Component, Input, OnInit, OnDestroy, Optional, Host, SkipSelf } from '@angular/core';
import {
  ControlContainer,
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

  constructor(
    @Optional() @Host() @SkipSelf() private controlContainer: ControlContainer,
    @Optional() private formGroupDirective: FormGroupDirective,
  ) {}

  ngOnInit(): void {
    const parentGroup =
      this.formGroup ??
      (this.controlContainer?.control as FormGroup | undefined);

    if (!parentGroup) {
      throw new Error(
        `app-input-text "${this.controlName}": debe usarse dentro de un FormGroup`,
      );
    }

    this.formGroup = parentGroup;
    this.formControl = this.formGroup.get(this.controlName) as FormControl;

    if (!this.formControl) {
      throw new Error(
        `app-input-text: no existe el control "${this.controlName}"`,
      );
    }

    if (this.formGroupDirective) {
      const submitSub = this.formGroupDirective.ngSubmit.subscribe(
        (value: any) => {
          this.submitted = value.isTrusted;
        },
      );
      this.sub.add(submitSub);
    }
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
