export interface IInventory {
  id?: number;
  description: string;
  stock: number;
  stockInUse?: number;
}

export class Inventory {
  id?: number;
  description: string;
  stock: number;
  stockInUse?: number;
  quantity?: number;
  constructor(inventory: IInventory) {
    this.description = inventory.description;
    this.stock = inventory.stock;
    this.stockInUse = inventory.stockInUse;
  }
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface InventoryListResponse {
  data: Inventory[];
  paginate: Paginate;
}
