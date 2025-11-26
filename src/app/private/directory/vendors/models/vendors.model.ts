export interface IVendor {
  id: number;
  name: string;
  address?: string;
  local?: string;
  phone?: string;
}

export class Vendor {
  id: number;
  name: string;
  address?: string;
  local?: string;
  phone?: string;

  constructor(role: IVendor) {
    this.id = role.id;
    this.name = role.name;
    this.address = role.name;
    this.local = role.local;
    this.phone = role.phone;
  }
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface VendorListResponse {
  data: Vendor[];
  paginate: Paginate;
}
