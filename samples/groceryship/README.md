# GroceryShip

*A clone of a 6.170 project built with Deja Vu.*

## Overview
Grocery Ship facilities peer grocery delivery. Students from the same college can post requests for groceries they need. Students who are going shopping can then claim and fulfill these requests. Requesters specify how much they're willing to pay as a delivery fee and which pickup locations they prefer. Payments are made once delivery is complete and both parties indicate this.

## Design Credit
Team Seals
- Czarina Lao
- Joseph Kuan
- Cheahuychou Mao
- Chien-Hsun Chang

[Original App](https://groceryship.herokuapp.com)

## Cliches Used
- StandardAuthentication
- Market
- Profile
- Rating
- Event
- Task

## Missing Features
- Limit users to people from MIT, i.e. use the MIT People API
- Enforce password strength requirements
- Send an email to verify the email address used on signup
- Include various additional fields to a request, such as Estimated Price (of the requested good), more detailed description of good quantity (e.g. 1 gallon of milk or 1 12oz. can), minimum rating for a shopper that can claim the request, possible grocery stores to buy the good from, possible pickup locations within MIT (maybe using a list widget), and an optional More Info field.
- Filter and sort claimable requests by deadline, tip, grocery store, pickup location, requester rating, etc.
- Filter, sort, and search claimed requests
- Set delivery time and actual price of the item in the request for multiple requests at once. Right now, users can do it for one request at a time. In the original version, users can select multiple requests by checking the appropriate checkboxes, and setting the delivery time all at once.
- Ability to cancel (soft delete) requests (right now, requests are changed to completed and approved in order to make them disappear when clicking cancel)
- Have a "seen" status for notifications so that they disappear when a certain action is taken, like rating the requester
- Fix some of the stylings. Only 1 child widget can be replaced using the syntax (new_widget replacing child_widget in widget), so some parts can't be made to look as in the original.
