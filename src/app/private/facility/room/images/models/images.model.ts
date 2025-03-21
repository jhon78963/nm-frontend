export interface Image {
  id: number;
  imageName: string;
  imagePath: string;
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface ImageListResponse {
  data: Image[];
  paginate: Paginate;
}
