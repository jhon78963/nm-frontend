import { MessageService } from 'primeng/api';

import { WooCommerceSyncResult } from '../private/inventories/products/models/product-media.model';
import { showSuccess, showToastWarn } from './notifications';

export function notifyWooCommerceSyncResult(
  messageService: MessageService,
  sync: WooCommerceSyncResult | undefined,
  successMessage: string,
): void {
  if (!sync) {
    showSuccess(messageService, successMessage);
    return;
  }

  if (!sync.attempted) {
    showToastWarn(
      messageService,
      `${successMessage} ${sync.error ?? 'La sincronización con WooCommerce está desactivada.'}`,
    );
    return;
  }

  if (sync.errors > 0) {
    showToastWarn(
      messageService,
      `${successMessage} Error en WooCommerce: ${sync.error ?? 'Revisa los logs del servidor.'}`,
    );
    return;
  }

  if (sync.products < 1) {
    showToastWarn(
      messageService,
      `${successMessage} ${sync.error ?? 'No se sincronizó en WooCommerce.'}`,
    );
    return;
  }

  showSuccess(
    messageService,
    `${successMessage} Producto sincronizado y publicado en la tienda online.`,
  );
}
