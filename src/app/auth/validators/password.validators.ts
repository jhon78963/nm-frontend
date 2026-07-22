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

/** Alineado con PrimeNG `mediumRegex`. */
export const PASSWORD_MEDIUM_MIN_LENGTH = 6;

export const PASSWORD_MEDIUM_PATTERN =
  /^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*\d))|((?=.*[A-Z])(?=.*\d))).{6,}$/;

export const PASSWORD_MEDIUM_MIN_LENGTH_MESSAGE =
  'La contraseña debe tener al menos 6 caracteres.';

export const PASSWORD_MEDIUM_COMPLEXITY_MESSAGE =
  'La contraseña debe incluir mayúsculas y minúsculas, o letras y números.';

export const mediumPasswordValidators = [
  Validators.required,
  Validators.minLength(PASSWORD_MEDIUM_MIN_LENGTH),
  Validators.pattern(PASSWORD_MEDIUM_PATTERN),
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

/** Mensaje UX para contraseñas con política media (restablecimiento admin). */
export function mediumPasswordValidationMessage(
  control: AbstractControl | null,
): string | null {
  if (!control?.errors) {
    return null;
  }

  if (control.errors['required']) {
    return 'La contraseña es obligatoria.';
  }

  if (control.errors['minlength']) {
    return PASSWORD_MEDIUM_MIN_LENGTH_MESSAGE;
  }

  if (control.errors['pattern']) {
    return PASSWORD_MEDIUM_COMPLEXITY_MESSAGE;
  }

  return null;
}
