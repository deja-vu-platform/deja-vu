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
    const {hh: startHh, mm: startMm} = getHhMm(startTime);
    const {hh: endHh, mm: endMm} = getHhMm(endTime);
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

// Get the hours and minutes in 24-hour format from a time in 12-hr format
// (hh:mm AM/PM)
function getHhMm(hhMmTime: string): {hh: number, mm: number} {
  const AM_LENGTH = 2;
  const PERIOD_HOURS = 12;
  const hhMm = hhMmTime.slice(0, -AM_LENGTH)
    .split(':');
  const ret = {hh: Number(hhMm[0]), mm: Number(hhMm[1])};
  if (hhMmTime.slice(-AM_LENGTH) === 'PM') {
    ret.hh = ret.hh + PERIOD_HOURS;
  }

  return ret;
}
