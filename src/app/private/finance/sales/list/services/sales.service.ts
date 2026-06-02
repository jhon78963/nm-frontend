import { Injectable } from '@angular/core';
import { Sale, SaleListResponse } from '../models/sales.model';
import {
  BehaviorSubject,
  firstValueFrom,
  map,
  Observable,
  switchMap,
} from 'rxjs';
import { ApiService } from '../../../../../services/api.service';
import {
  prepareReceiptHtmlForPreview,
  prepareReceiptHtmlForPrint,
} from '../../pos/components/print-receipt/print-receipt.print-document';

// 1. Interfaz del estado
export interface SaleFilterState {
  limit: number;
  page: number;
  search: string;
}

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  sales: Sale[] = [];
  sales$: BehaviorSubject<Sale[]> = new BehaviorSubject<Sale[]>(this.sales);

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  // 2. Variables de persistencia
  private filterState: SaleFilterState | null = null;
  private readonly STORAGE_KEY = 'sales_filter_state';

  constructor(private apiService: ApiService) {}

  // Métodos de Estado
  private setFilterState(limit: number, page: number, search: string) {
    this.filterState = { limit, page, search };
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.filterState));
  }

  getFilterState(): SaleFilterState | null {
    if (!this.filterState) {
      const saved = sessionStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        try {
          this.filterState = JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing sales filter state', e);
          return null;
        }
      }
    }
    return this.filterState;
  }

  clearFilterState() {
    this.filterState = null;
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
  ): Observable<void> {
    // 3. Guardar estado
    this.setFilterState(limit, page, name);

    let url = `sales?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
    }
    return this.apiService.get<SaleListResponse>(url).pipe(
      map((response: SaleListResponse) => {
        this.updateSales(response.data);
        this.updateTotalSales(response.paginate.total);
      }),
    );
  }

  getList(): Observable<Sale[]> {
    return this.sales$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  // 4. Helper para recargar manteniendo filtros
  private reloadWithCurrentState(): Observable<void> {
    const s = this.getFilterState();
    return this.callGetList(s?.limit ?? 10, s?.page ?? 1, s?.search ?? '');
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`sales/${id}`)
      .pipe(switchMap(() => this.reloadWithCurrentState()));
  }

  edit(id: number, data: Sale): Observable<void> {
    return this.apiService
      .patch(`sales/${id}`, data)
      .pipe(switchMap(() => this.reloadWithCurrentState()));
  }

  getOne(id: number): Observable<Sale> {
    return this.apiService.get(`sales/${id}`);
  }

  // --- NUEVAS FUNCIONES PARA CAMBIO DE MERCADERÍA ---

  searchByCode(code: string): Observable<SaleListResponse> {
    return this.apiService.get<SaleListResponse>(
      `sales?page=1&limit=1&search=${code}`,
    );
  }

  processExchange(payload: any): Observable<void> {
    return this.apiService
      .post('sales/exchange', payload)
      .pipe(switchMap(() => this.reloadWithCurrentState()));
  }

  /** Abre el ticket térmico en una pestaña con vista previa e impresión / guardar PDF. */
  async openTicketPreview(saleId: number): Promise<void> {
    const tab = window.open('', '_blank');
    if (!tab) {
      throw new Error(
        'Permite ventanas emergentes para ver el ticket de la venta.',
      );
    }

    tab.document.open();
    tab.document.write(
      '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:sans-serif;padding:16px">Cargando ticket...</body></html>',
    );
    tab.document.close();

    try {
      const html = await firstValueFrom(
        this.apiService.getHtml(`pos/sales/${saleId}/ticket`),
      );
      const previewDocument = prepareReceiptHtmlForPreview(html);
      tab.document.open();
      tab.document.write(previewDocument);
      tab.document.close();
    } catch (error) {
      tab.close();
      throw error;
    }
  }

  /** Imprime el ticket térmico directamente (sin abrir vista previa). */
  async printTicket(saleId: number): Promise<void> {
    const html = await firstValueFrom(
      this.apiService.getHtml(`pos/sales/${saleId}/ticket`),
    );
    const printDocument = prepareReceiptHtmlForPrint(html, true);
    await this.printViaFullscreenIframe(printDocument);
  }

  private printViaFullscreenIframe(fullHtml: string): Promise<void> {
    return new Promise(resolve => {
      document.getElementById('sales-ticket-print-frame')?.remove();

      const suppressedNodes: Array<{ node: HTMLElement; display: string }> = [];

      const suppressAppChrome = () => {
        Array.from(document.body.children).forEach(node => {
          const element = node as HTMLElement;
          if (element.id === 'sales-ticket-print-frame') {
            return;
          }
          suppressedNodes.push({
            node: element,
            display: element.style.display,
          });
          element.style.setProperty('display', 'none', 'important');
        });
        document.body.style.setProperty('overflow', 'hidden', 'important');
        document.body.style.setProperty('background', '#ffffff', 'important');
      };

      const restoreAppChrome = () => {
        suppressedNodes.forEach(({ node, display }) => {
          node.style.display = display;
        });
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('background');
      };

      const iframe = document.createElement('iframe');
      iframe.id = 'sales-ticket-print-frame';
      iframe.setAttribute('title', 'Ticket de venta');
      iframe.setAttribute(
        'style',
        [
          'position:fixed',
          'inset:0',
          'width:100%',
          'height:100%',
          'border:0',
          'margin:0',
          'padding:0',
          'z-index:2147483647',
          'background:#ffffff',
        ].join(';'),
      );

      suppressAppChrome();
      document.body.appendChild(iframe);

      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      let finished = false;

      const finish = () => {
        if (finished) {
          return;
        }
        finished = true;
        URL.revokeObjectURL(blobUrl);
        iframe.remove();
        restoreAppChrome();
        resolve();
      };

      iframe.onerror = finish;

      iframe.onload = () => {
        const printWindow = iframe.contentWindow;
        if (!printWindow) {
          finish();
          return;
        }

        printWindow.addEventListener('afterprint', finish, { once: true });

        requestAnimationFrame(() => {
          setTimeout(() => {
            try {
              printWindow.focus();
              printWindow.print();
            } catch {
              finish();
              return;
            }
            setTimeout(finish, 15_000);
          }, 500);
        });
      };

      iframe.src = blobUrl;
    });
  }

  private updateSales(value: Sale[]): void {
    this.sales = value;
    this.sales$.next(this.sales);
  }

  private updateTotalSales(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
