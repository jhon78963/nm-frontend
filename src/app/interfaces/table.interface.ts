export interface CallToAction<T> {
  type: 'button';
  size: 'small' | 'large' | undefined;
  icon: string;
  outlined: boolean;
  pTooltip: string;
  tooltipPosition: 'top' | 'bottom' | 'left' | 'right';
  click: (rowData: T, event?: Event) => void;
}

export interface Column {
  header: string;
  field: string;
  clickable: boolean;
  image: boolean;
  money: boolean;
}

export interface Paginate {
  page: number;
  first: number;
  rows: number;
  pageCount: number;
}
