import {
  AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 15;
const USERNAME_REGEX = new RegExp('^(?![_.-])(?!.*[_.-]{2})[a-zA-Z0-9._-]+$');

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 20;
const PASSWORD_REGEX = new RegExp([
  '^.*(?=.*[a-zA-Z])(?=.*[0-9])',
  '(?=.*[!@#$%^&*])(?!.*[`~()\\-_=+[{\\]}\\\|;:\\\'",.<>/? ]).*$'
].join(''));

export function UsernameValidator(): ValidatorFn[] {
  return [
    Validators.required,
    Validators.minLength(USERNAME_MIN_LENGTH),
    Validators.maxLength(USERNAME_MAX_LENGTH),
    Validators.pattern(USERNAME_REGEX)
  ];
}

export function PasswordValidator(): ValidatorFn[] {
  return [
    Validators.required,
    Validators.minLength(PASSWORD_MIN_LENGTH),
    Validators.maxLength(PASSWORD_MAX_LENGTH),
    Validators.pattern(PASSWORD_REGEX)
  ];
}

export function RetypePasswordValidator(passwordControl: FormControl)
  : ValidatorFn[] {
  return [
    Validators.required,
    passwordMatchValidator(() => passwordControl.value)
  ];
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

