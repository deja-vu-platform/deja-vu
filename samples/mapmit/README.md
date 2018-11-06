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
- Ability to cancel (delete) events (trivial, not worth the research time to add deletion everywhere)
- Ability to edit events (^)
- Add event description (persisted fields)
- Add room and location description (^)
- Events have a host (inherent to event? bind with post? new cliche?)
- Groups should have an owner (inherent to group? new cliche?)
- Only the group owner is allowed to add members (make admin inherent to group? new access cliche?)
- Only the event host can edit/cancel the event (^)
- Restrict MapMIT to the MIT community (authentication cliche - add regex to sign up)
- Events visible only to group members or to everyone (^)
- Filter events by public/group (depends on how group visibility is done)
