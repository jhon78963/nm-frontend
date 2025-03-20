import { MessageService } from 'primeng/api';

export function showSuccess(
  messageService: MessageService,
  message: string,
): void {
  messageService.add({
    severity: 'success',
    summary: 'Confirmado',
    detail: message,
    life: 3000,
  });
}

export function showError(
  messageService: MessageService,
  message: string,
): void {
  messageService.add({
    severity: 'error',
    summary: 'Error',
    detail: message,
    life: 3000,
  });
}

export function showToastWarn(
  messageService: MessageService,
  message: string,
): void {
  messageService.add({
    severity: 'warn',
    summary: 'Conflicto',
    detail: message,
    life: 15000,
  });
}
