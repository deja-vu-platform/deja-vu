import { AbstractControl, ValidationErrors } from '@angular/forms';

export function endDateValidator(getStartDate: () => any)
  : ((control: AbstractControl) => ValidationErrors) {
  return (control: AbstractControl): { [key: string]: any } => {
    const startDate = getStartDate();
    const endDate = control.value;
    if (!(startDate && endDate)) {
      return null;
    }
    if (endDate.isBefore(startDate)) {
      return { endDateBeforeStartDate: true };
    }

    return null;
  };
}

export function endTimeValidator(getStartTime: () => string)
  : ((control: AbstractControl) => ValidationErrors) {
  return (control: AbstractControl): { [key: string]: any } => {
    const startTime: string = getStartTime();
    const endTime: string = control.value;
    if (!(startTime && endTime)) {
      return null;
    }
    const [startHh, startMm] = startTime.split(':');
    const [endHh, endMm] = endTime.split(':');
    if (startHh > endHh || (startHh === endHh && startMm >= endMm)) {
      return { endTimeBeforeStartTime: true };
    }

    return null;
  };
}
