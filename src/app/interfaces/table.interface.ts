export interface CallToAction<T> {
  type: 'button';
  size: 'small' | 'large' | undefined;
  icon: string;
  outlined: boolean;
  pTooltip: string;
  tooltipPosition: 'top' | 'bottom' | 'left' | 'right';
  click: (rowData: T, event?: Event) => void;
  visible?: (rowData: T) => boolean;
}

export interface Column {
  header: string;
  field: string;
  clickable: boolean;
  image: boolean;
  money: boolean;
  color?: boolean;
  /**
   * Si `true`, la celda se renderiza como un `<p-tag>` de PrimeNG.
   * Usa `tagSeverityFn` para mapear el valor a una severity de PrimeNG.
   */
  tag?: boolean;
  /** Mapea el valor del campo a una severity de p-tag. */
  tagSeverityFn?: (value: string | null | undefined) => 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast';
}

export interface Paginate {
  page: number;
  first: number;
  rows: number;
  pageCount: number;
}
