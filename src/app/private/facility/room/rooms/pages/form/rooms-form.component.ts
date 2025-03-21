import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Observable } from 'rxjs';

import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { RoomsService } from '../../services/rooms.service';
import { RoomTypesService } from '../../../room-types/services/room-types.service';
import { SharedModule } from '../../../../../../shared/shared.module';

import { Room } from '../../models/rooms.model';
import { RoomType } from '../../../room-types/models/room-types.model';

@Component({
  selector: 'app-rooms-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './rooms-form.component.html',
  styleUrl: './rooms-form.component.scss',
})
export class RoomsFormComponent implements OnInit {
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly roomsService: RoomsService,
    private readonly roomTypesService: RoomTypesService,
    private readonly dialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
  ) {}

  form: FormGroup = this.formBuilder.group({
    number: ['', Validators.required],
    description: ['', Validators.required],
    roomTypeId: [null, Validators.required],
  });

  ngOnInit(): void {
    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.roomsService.getOne(id).subscribe((response: Room) => {
        this.form.patchValue(response);
      });
    }
    this.roomTypesService.callGetList().subscribe();
  }

  get roomTypes(): Observable<RoomType[]> {
    return this.roomTypesService.getList();
  }

  roomSaveButton() {
    if (this.form) {
      const roomtype = new Room(this.form.value);
      if (this.dynamicDialogConfig.data.id) {
        const id = this.dynamicDialogConfig.data.id;
        this.roomsService.edit(id, roomtype).subscribe({
          next: () => this.dialogRef.close(),
          error: () => this.dialogRef.close(),
        });
      } else {
        this.roomsService.create(roomtype).subscribe({
          next: () => this.dialogRef.close(),
          error: () => this.dialogRef.close(),
        });
      }
    }
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }
}
