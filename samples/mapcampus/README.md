# mapcampus

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


## Concepts Used
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
- Ability to edit events (edit event concept)
- Only the event host can edit the event (edit event concept and authorization can edit concept)
- Restrict mapcampus to the a university community (authentication concept - add regex to sign up)
- Filter events by public/group (depends on how group visibility is done)
