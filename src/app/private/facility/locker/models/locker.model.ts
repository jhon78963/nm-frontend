export interface Locker {
  id?: number;
  number: string;
  price: number;
  status: string;
  genderId: number;
  gender?: string;
  type: string;
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface LockerListResponse {
  data: Locker[];
  paginate: Paginate;
}

export interface IStatusLocker {
  id: number;
  status: string;
}

export class StatusLocker {
  id: number;
  status: string;

  constructor(locker: IStatusLocker) {
    this.id = locker.id;
    this.status = locker.status;
  }
}
