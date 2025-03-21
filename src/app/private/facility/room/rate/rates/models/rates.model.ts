export interface IRate {
  id: number;
  price: string;
  hourId: number;
  dayId: string;
}

export class Rate {
  id: number;
  price: string;
  hourId: number;
  dayId: string;

  constructor(rate: IRate) {
    this.id = rate.id;
    this.price = rate.price;
    this.hourId = rate.hourId;
    this.dayId = rate.dayId;
  }
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface RateListResponse {
  data: Rate[];
  paginate: Paginate;
}
