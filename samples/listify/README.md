# Listify

*A clone of a 6.170 project built with Déjà Vu.*

## Overview
Listify provides a quick and simple experience for crowdsourcing opinions on questions that ask for a ranking or for what is best/worst. Listify is an application that allows users to create lists for people to fill out by designating the items that can be put on the list, while also allowing freedom for suggestions for other items that should be in the pool of rankable items. Listify users can share the list's unique url, allowing them to easily get crowdsourcing for answers through group chats, emails, social media, etc.

## Design Credit
Team Phil
- Spencer Kim
- Max Lancaster
- Phillip Ou
- Bruno Prela

[Original App](https://listify-team-phil.herokuapp.com/)

## Cliches Used
- Authentication
- Group
- Property (2x)
- Ranking
- Scoring

## Missing Features
- Private lists, including inviting other users to those private lists and viewing lists a user has been invited to view (use Authorization++)
- Show lists by time (Log cliché)
- Add optional description and image url to staged list options, including the UI component to enter the info that can be toggled as shown/hidden
- Show lists created by a certain user (show objects by a property in Property) and count them
- Edit list objects so that they are locked (i.e. no one can submit rankings for it anymore)
- Undo votes for a list (need to edit scores in Scoring)
- Add more items/options to a list
- Edit rankings
- Choose how many options of a list users should rank
- Search bar that seraches lists by name
- Click on list card to view list/ranking instead of clicking a link on the list card
