export interface Paginate {
  total: number;
  pages: number;
}

export interface Gender {
  id: number;
  description: string;
  shortDescription: string;
}

export interface GenderListResponse {
  data: Gender[];
  paginate: Paginate;
}
