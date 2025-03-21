export interface ReservationTypeResponse {
  data: ReservationType[];
  paginate: Paginate;
}

export interface ReservationType {
  id: number;
  description: string;
}

export interface Paginate {
  total: number;
  pages: number;
}
