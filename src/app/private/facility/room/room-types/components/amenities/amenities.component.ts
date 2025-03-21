import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { PickListModule } from 'primeng/picklist';
import { RoomAmenitiesService } from '../../services/room-type-amenities.service';
import { Amenity } from '../../../amenities/models/amenities.model';

@Component({
  selector: 'app-amenities',
  standalone: true,
  imports: [TableModule, ToastModule, PickListModule],
  templateUrl: './amenities.component.html',
  styleUrl: './amenities.component.scss',
})
export class AddAmenitiesComponent implements OnInit {
  leftAmenities: Amenity[] = [];
  selectedAmenity: Amenity | undefined;
  sourceAmenities: Amenity[] | undefined;
  targetAmenities: Amenity[] | undefined;

  constructor(
    private readonly dynamicDialogConfig: DynamicDialogConfig,
    private readonly roomAmenitiesService: RoomAmenitiesService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = this.dynamicDialogConfig.data.id;
    this.updateAmenities(id);
  }

  updateAmenities(id: number): void {
    this.roomAmenitiesService.findLeft(id).subscribe({
      next: (response: Amenity[]) => {
        this.sourceAmenities = response;
        this.cdr.markForCheck();
      },
      error: () => {},
    });

    this.roomAmenitiesService.findAll(id).subscribe({
      next: (response: any) => {
        this.targetAmenities = response;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  addAmenity(event: any): void {
    const roomId = this.dynamicDialogConfig.data.id;
    const amenities = event.items;
    amenities.map((amenity: any) => {
      this.roomAmenitiesService.add(roomId, amenity.id).subscribe({
        next: () => {},
        error: () => {},
      });
    });
  }

  removeAmenity(event: any): void {
    const roomId = this.dynamicDialogConfig.data.id;
    const amenities = event.items;
    amenities.map((amenity: any) => {
      this.roomAmenitiesService.remove(roomId, amenity.id).subscribe({
        next: () => {},
        error: () => {},
      });
    });
  }
}
