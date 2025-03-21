import { IAmenity } from '../../amenities/models/amenities.model';
import { Image } from '../../images/models/images.model';
import { IRate } from '../../rate/rates/models/rates.model';
import { IReview } from '../../reviews/models/reviews.model';

export interface RoomStatus {
  label: string;
  value: string;
}

export interface IRoom {
  id: number;
  number: number;
  description: string;
  capacity: number;
  status: string;
  roomStatus: string;
  roomTypeId: number;
  roomType: string;
  customersNumber?: number;
  images: Image[];
  amenities: IAmenity[];
  rates: IRate[];
  reviews: IReview[];
}

export class Room {
  id: number;
  number: number;
  description: string;
  roomName?: string;
  capacity?: number;
  freeAge?: number;
  pricePerCapacity?: number;
  pricePerAdditionalPerson?: number;
  reservationId?: number;
  status: string;
  roomStatus?: string;
  roomTypeId: number;
  roomType?: string;
  images: Image[];
  amenities: IAmenity[];
  rates: IRate[];
  reviews: IReview[];
  constructor(room: IRoom) {
    this.id = room.id;
    this.number = room.number;
    this.description = room.description;
    this.status = room.status;
    this.roomTypeId = room.roomTypeId;
    this.images = room.images;
    this.amenities = room.amenities;
    this.rates = room.rates;
    this.reviews = room.reviews;
  }
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface RoomListResponse {
  data: Room[];
  paginate: Paginate;
}

export interface CRoom {
  id?: number;
  number: string;
  price: number;
  status: string;
  type: string;
}
