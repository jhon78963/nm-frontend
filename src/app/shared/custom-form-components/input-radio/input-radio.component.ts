import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RadioButtonModule } from 'primeng/radiobutton';

@Component({
  selector: 'app-input-radio',
  templateUrl: './input-radio.component.html',
  styleUrl: './input-radio.component.scss',
  standalone: true,
  imports: [RadioButtonModule, FormsModule, ReactiveFormsModule],
})
export class InputRadioComponent {
  @Input() name: string = '';
  @Input() id: string = '';
  @Input() for: string = '';
  @Input() value: string = '';
  @Input() label: string = '';
}
