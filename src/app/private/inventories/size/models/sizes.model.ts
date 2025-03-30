export interface Size {
  id: number;
  description: string;
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface SizeListResponse {
  data: Size[];
  paginate: Paginate;
}

export class SizeSave {
  id: number;
  description?: string;
  constructor(size: Size) {
    this.id = size.id;
    this.description = size.description;
  }
}
