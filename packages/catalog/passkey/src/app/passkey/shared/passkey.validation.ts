import {
  AbstractControl, ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';

// TODO: Update server.ts if any changes made
const PASSKEY_MIN_LENGTH = 3;
const PASSKEY_MAX_LENGTH = 15;

export function PasskeyValidator(): ValidatorFn[] {
  return [
    Validators.required,
    lengthValidator(PASSKEY_MIN_LENGTH, PASSKEY_MAX_LENGTH)
  ];
}

// Reference: https://bit.ly/2q4ElKa
function isEmptyInputValue(value: any): boolean {
  return value == null || value.length === 0;
}

function lengthValidator(minLength: number, maxLength: number)
  : ((control: AbstractControl) => ValidationErrors | null) {
  return (control: AbstractControl): { [key: string]: any } => {
    if (isEmptyInputValue(control.value)) {
      return null; // Don't validate empty values to allow optional controls
    }

    const length: number = control.value ? control.value.length : 0;

    if (length < minLength || length > maxLength) {
      return {
        incorrectLength: {
          minlength: minLength,
          maxlength: maxLength
        }
      };
    }

    return null;
  };
}
