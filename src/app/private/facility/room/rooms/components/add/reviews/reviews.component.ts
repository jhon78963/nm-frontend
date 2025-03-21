import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Review } from '../../../../reviews/models/reviews.model';
import { RoomReviewsService } from '../../../services/room-reviews.service';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { AvatarModule } from 'primeng/avatar';
import { RatingModule } from 'primeng/rating';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AvatarModule,
    RatingModule,
    ButtonModule,
    TooltipModule,
  ],
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.scss',
  providers: [MessageService],
})
export class AddReviewsComponent implements OnInit {
  reviews: Review[] = [];
  sinData: number = 0;

  constructor(
    private readonly dynamicDialogConfig: DynamicDialogConfig,
    private readonly roomReviewsService: RoomReviewsService,
    public messageService: MessageService,
  ) {}

  ngOnInit(): void {
    const id = this.dynamicDialogConfig.data.id;
    this.updateReviews(id);
  }

  updateReviews(id: number): void {
    this.roomReviewsService.findAll(id).subscribe({
      next: (response: any) => {
        this.reviews = response;
      },
      error: () => {},
    });
  }

  reviewRemoveButton(reviewId: number) {
    this.roomReviewsService.remove(reviewId).subscribe({
      next: () => {
        const roomId = this.dynamicDialogConfig.data.id;
        this.updateReviews(roomId);
        this.showSuccess('La reseña ha sido eliminado');
      },
      error: () => {},
    });
  }

  showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Confirmado',
      detail: message,
      life: 3000,
    });
  }
}
