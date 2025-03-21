export interface Customer {
  id: number;
  dni: string;
  name: string;
  surname: string;
}

export interface CreatedCustomer {
  message: string;
  customer: Customer;
}
