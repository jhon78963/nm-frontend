import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-input-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './input-search.component.html',
  styleUrl: './input-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputSearchComponent {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input({ required: true }) controlName!: string;
  @Input() placeholder: string = 'Buscar por...';
  @Output() clearFilter = new EventEmitter<void>();

  get searchControl(): FormControl | null {
    return this.formGroup.get(this.controlName) as FormControl | null;
  }

  onClearFilter(): void {
    this.clearFilter.emit();
  }
}
