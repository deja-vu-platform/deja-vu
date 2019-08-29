# Potluck

*A clone of a 6.170 project built with Deja Vu.*

## Overview
A tool to help people plan potlucks. Users can set a date for a party, invite guests, and coordinate bringing supplies.

## Design Credit
Team ARMR
- Anna Frederich
- Ryan Stuntz
- Maddie Severance
- Rachel Rotteveel

[Original App](http://potluck-armr.herokuapp.com/)

## Concepts Used
- Authentication
- Authorization
- Event
- Group
- Market
- Property

## Missing Features
*In parenthesis is what's needed for the feature.*
- Close out party (deletion, trivial but not worth research effort do to)
- Remove item from marketplace (deletion)
- Guests can decline party invitation (delete user from group)
- Add how much you paid for what you brought (persisted field, or use `pricePerGood` of market tx?)
- Party host (inherent to event/group, persisted field, or authorization)
- Reminder emails (make email concept work, require email instead of username for login)
- Only party host can invite, send emails, close party (proably new auth concept)
- Invite emails that don't have an account yet (need to rethink how account creation is done)

## Possible extensions

- instead of a text field for party location use a real address (use `geolocation`)
