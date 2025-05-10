import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ColorPickerModule } from 'ngx-color-picker';

@Component({
  selector: 'app-input-color-picker',
  standalone: true,
  imports: [ColorPickerModule, FormsModule, ReactiveFormsModule],
  templateUrl: './input-color-picker.component.html',
  styleUrls: ['./input-color-picker.component.scss'],
})
export class InputColorPickerComponent implements OnInit {
  @Input() controlName: string = 'color';

  formControl!: FormControl;
  formGroup!: FormGroup;
  color: string = '';

  constructor(private formGroupDirective: FormGroupDirective) {}

  ngOnInit(): void {
    this.formGroup = this.formGroupDirective.form;
    this.formControl = this.formGroup.get(this.controlName) as FormControl;

    // Inicia el color con el valor del form
    this.color = this.formControl.value || '#000000';

    // Escucha cambios externos (por ejemplo, reset)
    this.formControl.valueChanges.subscribe((value: any) => {
      if (value !== this.color) {
        this.color = value;
      }
    });
  }

  onColorSelected(newColor: string) {
    this.color = newColor;
    this.formControl.setValue(newColor);
  }
}
