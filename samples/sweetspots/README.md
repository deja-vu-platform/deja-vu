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
- Authentication
- Authorization
- Comment
- Follow
- Geolocation
- Label
- Property
- Rating
- Scoring (x2)

## Missing Features
*In parenthesis is what's needed for the feature.*
- Delete spots -> comment-delete-target, label-delete-item, rating-delete-target, follow-delete-publisher, property-delete-object
- Report spots (If a spot has been reported 10 more than the number of reviews it has (i.e. num(reports) > 10 + num(reviews)), the spot will automatically be deleted.)
- If there are search results, only display those spots on the map -> let display-map/ show-markers accept markerIds
- Timestamps -> log cliche
