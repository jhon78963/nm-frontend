import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-input-money',
  templateUrl: './input-money.component.html',
  styleUrl: './input-money.component.scss',
  standalone: true,
  imports: [InputNumberModule, FormsModule, ReactiveFormsModule],
})
export class InputMoneyComponent {
  @Input() currency: string = '';
  @Input() label: string = '';
}
