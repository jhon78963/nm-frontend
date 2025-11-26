export interface ICustomer {
  id: number;
  dni: string;
  name: string;
  surname: string;
}

export class Customer {
  id: number;
  dni: string;
  name: string;
  surname: string;

  constructor(user: Customer) {
    this.id = user.id;
    this.dni = user.dni;
    this.name = user.name;
    this.surname = user.surname;
  }
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface CustomerListResponse {
  data: Customer[];
  paginate: Paginate;
}
