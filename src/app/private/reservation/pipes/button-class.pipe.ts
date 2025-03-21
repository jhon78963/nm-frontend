import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'buttonClass',
  standalone: true,
})
export class ButtonClassPipe implements PipeTransform {
  transform(facility: any, isSelected: boolean): string {
    if (facility.status === 'AVAILABLE') {
      return isSelected ? 'p-button-primary' : 'p-button-success';
    } else if (facility.status === 'IN_USE') {
      return 'p-button-danger';
    } else if (facility.status === 'IN_CLEANING') {
      return 'p-button-secondary';
    } else if (facility.status === 'BOOKED') {
      return 'p-button-help';
    }
    return 'p-button-warning';
  }
}
