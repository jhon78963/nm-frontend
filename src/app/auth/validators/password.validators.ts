import { AbstractControl, Validators } from '@angular/forms';

/** Alineado con Laravel `Password::defaults()` (SEC-011). */
export const PASSWORD_MIN_LENGTH = 12;

/**
 * Mayúscula, minúscula, número y símbolo (no alfanumérico); mínimo 12 caracteres.
 */
export const PASSWORD_COMPLEXITY_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

export const PASSWORD_MIN_LENGTH_MESSAGE =
  'La contraseña debe tener al menos 12 caracteres.';

export const PASSWORD_COMPLEXITY_MESSAGE =
  'La contraseña debe incluir mayúsculas, minúsculas, números y símbolos.';

export const newPasswordValidators = [
  Validators.required,
  Validators.minLength(PASSWORD_MIN_LENGTH),
  Validators.pattern(PASSWORD_COMPLEXITY_PATTERN),
];

/** Mensaje UX para errores de contraseña nueva (formularios auth). */
export function passwordValidationMessage(
  control: AbstractControl | null,
): string | null {
  if (!control?.errors) {
    return null;
  }

  if (control.errors['required']) {
    return 'La contraseña es obligatoria.';
  }

  if (control.errors['minlength']) {
    return PASSWORD_MIN_LENGTH_MESSAGE;
  }

  if (control.errors['pattern']) {
    return PASSWORD_COMPLEXITY_MESSAGE;
  }

  return null;
}
