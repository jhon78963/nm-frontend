export interface IAmenity {
  id: number;
  description: string;
}

export class Amenity {
  id: number;
  description: string;

  constructor(amenity: IAmenity) {
    this.id = amenity.id;
    this.description = amenity.description;
  }
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface AmenityListResponse {
  data: Amenity[];
  paginate: Paginate;
}
