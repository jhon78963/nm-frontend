import { IAmenity } from '../../amenities/models/amenities.model';
import { IRate } from '../../rate/rates/models/rates.model';

export interface IRoomType {
  id: number;
  description: string;
  capacity: number;
  rentalHours: number;
  pricePerCapacity: number;
  pricePerAdditionalPerson: number;
  pricePerExtraHour: number;
  ageFree: number;
  amenities: IAmenity[];
  rates: IRate[];
}

export class RoomType {
  id: number;
  description: string;
  capacity: number;
  rentalHours: number;
  pricePerCapacity: number;
  pricePerAdditionalPerson: number;
  pricePerExtraHour: number;
  ageFree: number;
  amenities: IAmenity[];
  rates: IRate[];
  constructor(roomType: IRoomType) {
    this.id = roomType.id;
    this.description = roomType.description;
    this.capacity = roomType.capacity;
    this.rentalHours = roomType.rentalHours;
    this.pricePerCapacity = roomType.pricePerCapacity;
    this.pricePerAdditionalPerson = roomType.pricePerAdditionalPerson;
    this.pricePerExtraHour = roomType.pricePerExtraHour;
    this.ageFree = roomType.ageFree;
    this.amenities = roomType.amenities;
    this.rates = roomType.rates;
  }
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface RoomTypeListResponse {
  data: RoomType[];
  paginate: Paginate;
}
