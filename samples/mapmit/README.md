# mapMIT

*A clone of a 6.170 project built with Deja Vu.*

## Overview
Allows members of the MIT community to plan events on campus, with a map showing where they will be held.
Events can be made public or private to a group of other users.

## Design Credit
Team RECD
- Dora Tzeng
- Elysa Kohrs
- Jisoo Hong
- Rena Liu

[Original App](http://mapmit.herokuapp.com/)

## Cliches Used
- Authentication
- Authorization
- Geolocation
- Event
- Group
- Property

## Missing Features
*In parenthesis is what's needed for the feature.*
- Filter events by time (search events by time widget)
- Pick location from list of MIT buildings (location from list widget…if we want to support this)
- Search for events by location (show markers by location widget, but should probably move away from lat+lng)
- Ability to edit events (^)
- Only the event host can edit/cancel the event (^)
- Restrict MapMIT to the MIT community (authentication cliche - add regex to sign up)
- Filter events by public/group (depends on how group visibility is done)
