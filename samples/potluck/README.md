# Potluck

*A clone of a 6.170 project built with Deja Vu.*

## Overview
A tool to help people plan parties. Users can set a date for a party, invite guests, and coordinate bringing supplies.

## Design Credit
Team ARMR
- Anna Frederich
- Ryan Stuntz
- Maddie Severance
- Rachel Rotteveel

[Original App](http://potluck-armr.herokuapp.com/)

## Cliches Used
- Auth
- Event
- Group
- Market

## Missing Features
*In parenthesis is what's needed for the feature.*
- Close out party (deletion, trivial but not worth research effort do to)
- Remove item from marketplace (deletion)
- Guests can decline party invitation (delete user from group)
- Party title (persisted field)
- Party description (persisted field)
- Units for supplies (persisted field)
- Add how much you paid for what you brought (persisted field)
- Party host (inherent to event/group, or persisted field)
- Location for party (make this inherent to event, bind with something like map, or persisted field)
- Reminder emails (make email cliche work, require email instead of username for login)
- Only party host can invite, send emails, close party (proably new auth cliche)
- Invite emails that don't have an account yet (need to rethink how account creation is done)
