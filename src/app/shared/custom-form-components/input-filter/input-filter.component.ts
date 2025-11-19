import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-input-filter',
  standalone: true,
  imports: [ButtonModule, CommonModule],
  templateUrl: './input-filter.component.html',
  styleUrl: './input-filter.component.scss',
})
export class InputFilterComponent {
  @Input({ required: true }) collection: any[] = [];
  @Input() selectedId: number | null = 1;
  @Input() label: string | null = null;
  @Output() selectionChange = new EventEmitter<number>();

  onSelect(id: number) {
    if (this.selectedId !== id) {
      this.selectedId = id;
      this.selectionChange.emit(id);
    }
  }
}
