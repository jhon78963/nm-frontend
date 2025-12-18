export interface ISale {
  id: number;
  code: string;
  creationTime: string;
  total: number;
  status: string;
  paymentMethod: string;
  customer: string;
}

export class Sale {
  id: number;
  code: string;
  creationTime: string;
  total: number;
  status: string;
  paymentMethod: string;
  customer: string;

  constructor(sale: ISale) {
    this.id = sale.id;
    this.code = sale.code;
    this.creationTime = sale.creationTime;
    this.total = sale.total;
    this.status = sale.status;
    this.paymentMethod = sale.paymentMethod;
    this.customer = sale.customer;
  }
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface SaleListResponse {
  data: Sale[];
  paginate: Paginate;
}
