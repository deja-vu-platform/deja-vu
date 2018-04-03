import {
  AbstractControl, ValidationErrors, Validators
} from '@angular/forms';


export function passwordMatchValidator(getOriginalPassword: () => string)
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
