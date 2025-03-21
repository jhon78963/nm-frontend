import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { PickListModule } from 'primeng/picklist';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { Rate } from '../../../rate/rates/models/rates.model';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { RoomRatesService } from '../../services/room-type-rates.service';

@Component({
  selector: 'app-rates',
  standalone: true,
  imports: [TableModule, ToastModule, PickListModule],
  templateUrl: './rates.component.html',
  styleUrl: './rates.component.scss',
})
export class AddRatesComponent implements OnInit {
  leftRates: Rate[] = [];
  selectedRate: Rate | undefined;
  sourceRates: Rate[] | undefined;
  targetRates: Rate[] | undefined;

  constructor(
    private readonly dynamicDialogConfig: DynamicDialogConfig,
    private readonly roomRatesService: RoomRatesService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = this.dynamicDialogConfig.data.id;
    this.updateRates(id);
  }

  updateRates(id: number): void {
    this.roomRatesService.findLeft(id).subscribe({
      next: (response: Rate[]) => {
        this.sourceRates = response;
        this.cdr.markForCheck();
      },
      error: () => {},
    });

    this.roomRatesService.findAll(id).subscribe({
      next: (response: any) => {
        this.targetRates = response;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  addRate(event: any): void {
    const roomId = this.dynamicDialogConfig.data.id;
    const rates = event.items;
    rates.map((rates: any) => {
      this.roomRatesService.add(roomId, rates.id).subscribe({
        next: () => {},
        error: () => {},
      });
    });
  }

  removeRate(event: any): void {
    const roomId = this.dynamicDialogConfig.data.id;
    const rates = event.items;
    rates.map((rates: any) => {
      this.roomRatesService.remove(roomId, rates.id).subscribe({
        next: () => {},
        error: () => {},
      });
    });
  }
}
