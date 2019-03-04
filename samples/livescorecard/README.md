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
- Group (x2)
- Label (x2)
- Property (x3)
- Scoring (x2)

## Missing Features
### Host
- Edit competition info -> Event, Property
- Delete competition info -> Property, Passkey
- Edit participant info ->  Property, Label
- Delete participant info ->  Property, Passkey, Label
- Edit problem info ->  Property, Scoring, Label
- Delete problem info -> Property, Scoring, Label
- Sort climbers in alphabetical order -> Needs a Sort or Filter cliche

### Climber
<!-- All for now -->
- Record number of falls per climb -> Scoring cliche
- Leaderboard -> Scoring cliche
- Sort climbs by name/ points -> Needs a Sort or Filter cliche
- Give approval by entering credentials -> Needs new widget in the Task cliche

### Spectator
<!-- All for now -->
- Leaderboard -> Scoring cliche
