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
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-input-select',
  templateUrl: './input-select.component.html',
  styleUrl: './input-select.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class InputSelectComponent implements OnInit, OnDestroy {
  @Input() label: string = '';
  @Input() for: string = '';
  @Input() options: any[] = [];
  @Input() id: string = '';
  @Input() controlName: string = 'select';
  @Input() optionLabel: string = 'name'; // Campo para mostrar texto
  @Input() placeholder: string = 'Seleccione una opción';
  @Input() optionValue: string = 'id'; // Campo para el valor
  @Input() showClear: boolean = false;
  @Input() formGroup?: FormGroup<any>;

  formControl!: FormControl;
  submitted!: boolean;
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
        `app-input-select "${this.controlName}": debe usarse dentro de un FormGroup`,
      );
    }

    this.formGroup = parentGroup;
    this.formControl = this.formGroup.get(this.controlName) as FormControl;

    if (!this.formControl) {
      throw new Error(
        `app-input-select: no existe el control "${this.controlName}"`,
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
