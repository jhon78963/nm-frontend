export interface Rating {
  id: number;
  rating: string;
}

export interface IReview {
  id: number;
  customerName: string;
  description: string;
  rating: string;
  roomId: number;
  date: string;
  image: string;
}

export class Review {
  id: number;
  customerName: string;
  description: string;
  rating: string;
  roomId: number;
  date: string;
  image: string;

  constructor(review: IReview) {
    this.id = review.id;
    this.customerName = review.customerName;
    this.description = review.description;
    this.rating = review.rating;
    this.roomId = review.roomId;
    this.date = review.date;
    this.image = review.image;
  }
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface ReviewListResponse {
  data: Review[];
  paginate: Paginate;
}
