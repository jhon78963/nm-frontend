import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
  selector: 'app-input-multi-select',
  templateUrl: './input-multi-select.component.html',
  styleUrl: './input-multi-select.component.scss',
  standalone: true,
  imports: [MultiSelectModule, FormsModule, ReactiveFormsModule],
})
export class InputMultiSelectComponent {
  selectedMulti: any[] = [];
  @Input() options: any[] = [];
  @Input() selectedValues: any[] = [];
  @Input() placeholder: string = '';
  @Input() optionLabel: string = '';
  @Input() label: string = '';
  @Input() display: string = 'chip';
}
