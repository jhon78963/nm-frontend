import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-input-checkbox',
  templateUrl: './input-checkbox.component.html',
  styleUrl: './input-checkbox.component.scss',
  standalone: true,
  imports: [CheckboxModule, FormsModule, ReactiveFormsModule],
})
export class InputCheckboxComponent {
  @Input() label: string = '';
  @Input() name: string = '';
  @Input() value: boolean = false;
  @Input() id: string = '';
  @Input() for: string = '';
}
