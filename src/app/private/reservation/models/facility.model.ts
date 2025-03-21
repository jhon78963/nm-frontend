export enum FacilityType {
  LOCKER = 'locker',
  ROOM = 'room',
  PRODUCT = 'product',
  SERVICE = 'service',
}

export interface Facility {
  id: number;
  number: string;
  status: string;
  price: number;
  type: string;
  reservation?: number;
}

export interface FacilityCount {
  count: number;
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface FacilityListResponse {
  data: Facility[];
  paginate: Paginate;
}
