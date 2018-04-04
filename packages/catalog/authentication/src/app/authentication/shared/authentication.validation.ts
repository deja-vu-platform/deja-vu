import {
  AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 15;
const USERNAME_REGEX = new RegExp('^(?![_.-])(?!.*[_.-]{2})[a-zA-Z0-9._-]+$');
const USERNAME_PATTERN_MSG = 'alphanumeric and special characters ._-';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 20;
const PASSWORD_REGEX = new RegExp([
  '^.*(?=.*[a-zA-Z])(?=.*[0-9])',
  '(?=.*[!@#$%^&*])(?!.*[`~()\\-_=+[{\\]}\\\|;:\\\'",.<>/? ]).*$'
].join(''));
const PASSWORD_PATTERN_MSG = 'at least 1 lowercase letter, 1 uppercase letter,'
  + '1 special character (!@#$%^*&) and 1 number (0-9)';

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
    const invalid = regExp.test(value);

    if (!invalid) {
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
