# Sweet Spots

*A clone of a 6.170 application built with Deja Vu.*

## Overview
Allows users to mark points of interest on a map and review spots added by others.

## Design Credit
Team No REST for the Wicked
- Maryam Archie
- Nishchal Bhandari
- Bob Liang
- Isaac Rosado

[Original App](https://sweet-spots.herokuapp.com/)

## Cliches Used
- Auth
- Map
- Rating
- Comment
- Label
- Follow

## Missing Features
*In parenthesis is what's needed for the feature.*
- Delete spots (deletion, trivial and not worth spending research time on)
- Floor (persisted field)
- Up/Down Votes for Reviews (new cliche, probably)
- User reputation (new cliche, probably)
- Need both rating and comment for review (atomic forms)
- Require all fields to create spot (atomic forms)
- Click review author username to see profile (refactor ShowComment widget, or way to override its template)
- Show spots by creator (could bind with post, but that’s a bit hacky, seems like ownership is a general issue)
- Only one review per user (need to think about this more)
- Report spots (it's unclear what this did, if anything, in the original)
