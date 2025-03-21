export interface Product {
  id: number;
  name: string;
  productTypeId: number;
  productType?: string;
  price: number;
  priceString?: string;
  quantity: number;
  quantityPivote: number;
  total: number;
  isPaid: boolean;
  isPaidBd: boolean;
  isFree: boolean;
  isFreeBd: boolean;
  type: string;
  isAdd: boolean;
  isChecked: boolean;
  isBd: boolean;
  isSent: boolean;
  selectedFacilities: any[];
}
