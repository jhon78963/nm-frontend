import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';
import { Locker } from '../../../facility/locker/models/locker.model';
import { LockersService } from '../../../facility/locker/services/lockers.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { FacilitiesService } from '../../services/facilities.service';
import { RoomsService } from '../../../facility/room/rooms/services/rooms.service';
import { CRoom } from '../../../facility/room/rooms/models/rooms.model';

@Component({
  selector: 'app-change-lockers',
  standalone: true,
  imports: [ButtonModule, CommonModule, ConfirmDialogModule],
  templateUrl: './lockers.component.html',
  styleUrl: './lockers.component.scss',
})
export class ChangeLockersComponent implements OnInit {
  constructor(
    private readonly dynamicDialogConfig: DynamicDialogConfig,
    private readonly dynamicDialogRef: DynamicDialogRef,
    private readonly confirmationService: ConfirmationService,
    private readonly lockersService: LockersService,
    private readonly facilitiesService: FacilitiesService,
    private readonly roomsService: RoomsService,
  ) {}

  ngOnInit(): void {
    this.getLockers();
    this.getRooms();
  }

  getLockers() {
    this.lockersService.getLockersAvailable().subscribe();
  }

  get lockers(): Observable<Locker[]> {
    return this.lockersService.getAvailableList();
  }

  changeLocker(newLocker: Locker) {
    const reservationId = this.dynamicDialogConfig.data.reservationId;
    const lockerId = this.dynamicDialogConfig.data.lockerId;

    this.confirmationService.confirm({
      message: `Deseas cambiar al locker N° ${newLocker.number}?`,
      header: `Locker N° ${newLocker.number}`,
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',
      accept: () => {
        if (newLocker && newLocker.id) {
          this.lockersService
            .change(reservationId, lockerId, newLocker.id)
            .subscribe({
              next: () => {
                this.getLockers();
                if (newLocker && newLocker.id) {
                  this.updateLocker(lockerId, 'AVAILABLE');
                  this.updateLocker(newLocker.id, 'IN_USE');
                  this.dynamicDialogRef.close({
                    success: true,
                    oldLockerId: lockerId,
                    newLocker: newLocker,
                  });
                }
              },
            });
        }
      },
      reject: () => {},
    });
  }

  updateLocker(lockerId: number, status: string): void {
    const body: any = {
      id: lockerId,
      status,
    };
    if (lockerId) {
      this.facilitiesService.changeLockerStatus(lockerId, body).subscribe();
    }
  }

  getRooms() {
    this.roomsService.getRoomsAvailable().subscribe();
  }

  get rooms(): Observable<CRoom[]> {
    return this.roomsService.getAvailableList();
  }

  changeRoom(newRoom: CRoom) {
    const reservationId = this.dynamicDialogConfig.data.reservationId;
    const lockerId = this.dynamicDialogConfig.data.lockerId;
    const oldPrice = this.dynamicDialogConfig.data.price;

    this.confirmationService.confirm({
      message: `Deseas cambiar a la habitación N° ${newRoom.number}?`,
      header: `Habitación N° ${newRoom.number}`,
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',
      accept: () => {
        if (newRoom && newRoom.id) {
          this.lockersService
            .changeToRoom(
              reservationId,
              lockerId,
              newRoom.id,
              newRoom.price,
              oldPrice,
            )
            .subscribe({
              next: () => {
                this.getRooms();
                if (newRoom && newRoom.id) {
                  this.updateLocker(lockerId, 'AVAILABLE');
                  this.updateRoom(newRoom.id, 'IN_USE');
                  this.dynamicDialogRef.close({
                    success: true,
                    oldLockerId: lockerId,
                    newLocker: newRoom,
                  });
                }
              },
            });
        }
      },
      reject: () => {},
    });
  }

  updateRoom(roomId: number, status: string): void {
    const body: any = {
      id: roomId,
      status,
    };
    if (roomId) {
      this.facilitiesService.changeRoomStatus(roomId, body).subscribe();
    }
  }
}
