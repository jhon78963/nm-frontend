export interface Service {
  id: number;
  name: string;
  quantity: number;
  price: number;
  priceString?: string;
  total: number;
  isBd: boolean;
  isPaidBd: boolean;
}
