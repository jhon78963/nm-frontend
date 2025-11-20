import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-input-filter',
  standalone: true,
  imports: [ButtonModule, CommonModule, RippleModule],
  templateUrl: './input-filter.component.html',
  styleUrl: './input-filter.component.scss',
})
export class InputFilterComponent {
  @Input({ required: true }) collection: any[] = [];
  @Input() selectedIds: number[] = [];
  @Input() label: string | null = null;
  @Output() selectionChange = new EventEmitter<number[]>();

  onSelect(id: number) {
    if (this.selectedIds.includes(id)) {
      this.selectedIds = this.selectedIds.filter(itemId => itemId !== id);
    } else {
      this.selectedIds = [...this.selectedIds, id];
    }

    this.selectionChange.emit(this.selectedIds);
  }
}
