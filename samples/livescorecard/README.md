# LiveScorecard

*A clone of a 6.170 application built with Deja Vu.*

## Overview
Enables climbers to log their climbs and for others to view the results in real-time.

## Design Credit
Team Reach
- Charlie Andrews
- Michelle Lauer
- Ruth Park
- Chandler Squires

[Original App](http://livescorecard.herokuapp.com)

## Cliches Used
- Authorization
- Authentication
- Passkey (x2)
- Event
- Task
- Group (x3)
- Label (x2)
- Property (x3)
- Scoring (x2)

## Missing Features
### Host
- Edit competition info -> Event, Property
- Delete competition info -> Property, Passkey
- Edit participant info ->  Property, Label
- Delete participant info ->  Property, Passkey, Label
- Edit climb info ->  Property, Scoring, Label
- Delete climb info -> Property, Scoring, Label
- Sort climbers in alphabetical order -> Needs a Sort or Filter cliche

### Climber
- Sort climbs by number -> Needs a Sort cliche
- Filter climbers by sex and category (also filter climbs by categoery) ->
Use `search-items-by label` action, but need to add `waitOn` input to
`show-tasks` action.
- Give approval by entering credentials -> Needs new widget in the Task cliche
