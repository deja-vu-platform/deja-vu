# Schedule

Find times to meet

## Actions

- create-schedule
- delete-schedule
- show-all-availability
- show-next-availability
- show-schedule
- show-slot
- show-slots
- update-schedule

## Notes

To use this cliché in your app you need to add the following
to `styles.css`:

```css
@import "~angular-calendar/css/angular-calendar.css";

.cal-week-hours-view .cal-day-headers {
  display: flex;
}

.cal-week-hours-view .cal-header {
  flex: 1;
  text-align: center;
}

.cal-week-hours-view .cal-header:first-child {
  flex: 0.5;
  text-align: center;
}

.cal-week-hours-view .cal-days-container {
  display: flex;
}

.cal-week-hours-view .cal-day-container {
  flex: 1;
}

.cal-week-hours-view .cal-day-container:first-child {
  flex: 0.5;
}

.cal-week-hours-view .cal-day-view .cal-week-hour-odd {
  background: #ffffff;
}

.cal-week-hours-view .cal-day-view .cal-week-hour-even {
  background: #fafafa;
}

.cal-week-hours-view .cal-day-view .cal-hour:not(:last-child) .cal-hour-segment,
.cal-week-hours-view .cal-day-view .cal-hour:last-child :not(:last-child) .cal-hour-segment {
  border-bottom: 1px dotted #e1e1e1;
}

.cal-week-hours-view .cal-day-view .cal-hour-rows {
  overflow-y: hidden;
}
```
