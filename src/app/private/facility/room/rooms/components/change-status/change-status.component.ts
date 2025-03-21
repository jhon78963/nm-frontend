import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { RadioButtonModule } from 'primeng/radiobutton';

import { Room, RoomStatus } from '../../models/rooms.model';
import { RoomsService } from '../../services/rooms.service';

@Component({
  selector: 'app-change-status',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    RadioButtonModule,
  ],
  templateUrl: './change-status.component.html',
  styleUrl: './change-status.component.scss',
})
export class ChangeStatusComponent implements OnInit {
  statuses: RoomStatus[] = [
    { label: 'Disponible', value: 'AVAILABLE' },
    { label: 'Ocupado', value: 'IN_USE' },
    { label: 'En Limpieza', value: 'IN_CLEANING' },
  ];

  form: FormGroup = this.formBuilder.group({
    status: [null, Validators.required],
  });
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly roomsService: RoomsService,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
    private readonly dynamicDialogRef: DynamicDialogRef,
  ) {}

  ngOnInit() {
    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.roomsService.getOne(id).subscribe((response: any) => {
        this.form.patchValue(response);
      });
    }
  }

  changeRoomStatusButton() {
    if (this.form) {
      const id = this.dynamicDialogConfig.data.id;
      const data = new Room(this.form.value);
      this.roomsService.changeStatus(id, data).subscribe({
        next: () => this.dynamicDialogRef.close(),
        error: () => this.dynamicDialogRef.close(),
      });
    }
  }
}
