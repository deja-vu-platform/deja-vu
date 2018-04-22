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
- StandardAuthentication
- PasskeyAuthentication
- Event
- Task
- Group

## Missing Features
### Host 
- Register with profile information -> `Profile` cliche
- Display host profile info -> `Profile` cliche
- Edit competition info -> `Event`, `Group` cliches
- Edit climber info ->  `Group` cliche
- List number of climbers -> Needs new widget in the `Group` cliche
- List number of climbs -> Needs new widget in the `Task` cliche
- Leaderboard -> `Scoring` cliche
- Add sex, category info for a climber -> Persisted fields OR create new widgets in the `Profile` cliche
- Add point, category info for a climb -> Persisted fields
- Sort climbers in alphabetical order -> Needs a `Sort` or `Filter` cliche

### Climber 
- Record number of falls per climb -> `Scoring` cliche
- Leaderboard -> `Scoring` cliche
- Sort climbs by name/ points -> Needs a `Sort` or `Filter` cliche
- Give approval by entering credentials -> Needs new widget in the `Task` cliche

### Spectator 
- Leaderboard -> `Scoring` cliche
