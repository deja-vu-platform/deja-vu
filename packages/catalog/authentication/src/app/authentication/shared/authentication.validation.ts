import {
  AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';
import {
  PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, PASSWORD_PATTERN_MSG,
  PASSWORD_REGEX, USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH,
  USERNAME_PATTERN_MSG, USERNAME_REGEX
} from '../../../../shared/authentication.config';

export function UsernameValidator(): ValidatorFn[] {
  return [
    Validators.required,
    lengthValidator(USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH),
    regexValidatorWithCustomMessage(USERNAME_REGEX, USERNAME_PATTERN_MSG)
  ];
}

export function PasswordValidator(): ValidatorFn[] {
  return [
    Validators.required,
    lengthValidator(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH),
    regexValidatorWithCustomMessage(PASSWORD_REGEX, PASSWORD_PATTERN_MSG)
  ];
}

export function RetypePasswordValidator(passwordControl: FormControl)
  : ValidatorFn[] {
  return [
    Validators.required,
    passwordMatchValidator(() => passwordControl.value)
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

function regexValidatorWithCustomMessage(regExp: RegExp, msg: string)
  : ((control: AbstractControl) => ValidationErrors) {
  return (control: AbstractControl): { [key: string]: any } => {
    if (isEmptyInputValue(control.value)) {
      return null; // Don't validate empty values to allow optional controls
    }

    const value: string = control.value;
    const valid = regExp.test(value);

    if (!valid) {
      return { incorrectPattern: msg };
    }

    return null;
  };
}


function passwordMatchValidator(getOriginalPassword: () => string)
  : ((control: AbstractControl) => ValidationErrors) {
  return (control: AbstractControl): { [key: string]: any } => {
    const originalPassword = getOriginalPassword();
    const retypedPassword = control.value;

    if (originalPassword !== retypedPassword) {
      return {
        unmatchedPasswords: {
          originalPassword: originalPassword,
          retypedPassword: retypedPassword
        }
      };
    }

    return null;
  };
}
