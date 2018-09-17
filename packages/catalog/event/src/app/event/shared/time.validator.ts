import {
  AbstractControl, ValidationErrors, Validators
} from '@angular/forms';


export function endTimeValidator(getStartTime: () => string)
  : ((control: AbstractControl) => ValidationErrors) {
  return (control: AbstractControl): {[key: string]: any} => {
    const startTime = getStartTime();
    const endTime = control.value;
    if (!(startTime && endTime)) {
      return null;
    }
    const [startHh, startMm] = startTime.split(':');
    const [endHh, endMm] = endTime.split(':');
    if (startHh > endHh || (startHh === endHh && startMm >= endMm)) {
      return {
        endBeforeStart: {
          startTime: startTime, endTime: endTime
        }
      };
    }

    return null;
  };
}
