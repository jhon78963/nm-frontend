export interface Paginate {
  total: number;
  pages: number;
}

export interface Gender {
  id: number;
  gender: string;
  shortGender: string;
}

export interface GenderListResponse {
  data: Gender[];
  paginate: Paginate;
}
