export type SunatStatus = 'PENDING' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'VOIDED';
export type DocumentType = 'BOLETA' | 'FACTURA' | 'TICKET_INTERNO';

export interface ISale {
  id: number;
  code: string;
  creationTime: string;
  total: number;
  status: string;
  paymentMethod: string;
  customer: string;
  // Campos de facturación electrónica (opcionales: null en ventas antiguas)
  document_type?: DocumentType | null;
  full_invoice_number?: string | null;
  serie?: string | null;
  correlativo?: number | null;
  taxable_base?: number | null;
  igv_amount?: number | null;
  sunat_status?: SunatStatus | null;
  xml_path?: string | null;
  cdr_path?: string | null;
}

export class Sale {
  id: number;
  code: string;
  creationTime: string;
  total: number;
  status: string;
  paymentMethod: string;
  customer: string;
  document_type?: DocumentType | null;
  full_invoice_number?: string | null;
  serie?: string | null;
  correlativo?: number | null;
  taxable_base?: number | null;
  igv_amount?: number | null;
  sunat_status?: SunatStatus | null;
  xml_path?: string | null;
  cdr_path?: string | null;

  constructor(sale: ISale) {
    this.id = sale.id;
    this.code = sale.code;
    this.creationTime = sale.creationTime;
    this.total = sale.total;
    this.status = sale.status;
    this.paymentMethod = sale.paymentMethod;
    this.customer = sale.customer;
    this.document_type = sale.document_type;
    this.full_invoice_number = sale.full_invoice_number;
    this.serie = sale.serie;
    this.correlativo = sale.correlativo;
    this.taxable_base = sale.taxable_base;
    this.igv_amount = sale.igv_amount;
    this.sunat_status = sale.sunat_status;
    this.xml_path = sale.xml_path;
    this.cdr_path = sale.cdr_path;
  }
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface SaleListResponse {
  data: Sale[];
  paginate: Paginate;
}
