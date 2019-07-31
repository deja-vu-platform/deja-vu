---
layout: default
---

# about

Rehash (re#) is a **platform for building web apps**. 
It features a catalog of
[full-stack functionality](./catalog)
and an [HTML-like language](./intro) for
assembling web apps using the catalog.
With re# you can build [complex apps](./samples) fast, without writing any
client- or server-side procedural code.

Re# implements [a new approach to app development](./research). In this approach,
you build apps by synchronizing, in a declarative fashion, GUI components of
granular, full-stack modules that implement end-user behavior.

- **batteries included** In re#, a web app is constructed
by composing concepts.
A concept is a self-contained, reusable,
increment of functionality that is motivated by a purpose defined in terms of
the needs of a user. For example, think of the "comment" functionality
on Facebook or "rating" on Amazon. We have a growing [catalog of
concepts](./catalog) you can use to build your app.

- **assemble with HTML** The assembly requires no traditional
code: concepts are [glued together by declarative bindings](./intro)
that ensure appropriate synchronization and dataflow. These
bindings are expressed in an HTML-like 
language, augmenting conventional layout declarations that
determine which user interface widgets from which concepts
are used, and how they are placed on the page. Concepts
are configured in JSON and you can style your app with CSS.

- **conventional output** A compiled re# app is a standard MEAN
(MongoDB-Express-Angular-Node.js) app, which can be
easily deployed with popular cloud providers.
If you don't have a preferred cloud provider, you can 
follow our guide to [deploy]() to Heroku.


**Re# is a research prototype and you shouldn't rely on it for anything
important at this point**, but we'd love to hear what you think!
You can play around with it and email us or create an issue with your
feedback or questions.

## why

- **general-purpose tools are an overkill for many web apps**
General-purpose
programming languages and web frameworks/libraries are
flexible, and with them you can build any web app you'd like,
no matter how custom your requirements are. But building relatively
simple apps can take a lot of time and expertise.
Even if you
assume there is a library for each end-user functionalily you need,
you still have to spend significant effort gluing all the client-
and server-side components/libraries together. In many cases,
this requires writing complicated server-side code to deal with
HTTP requests and databases.

- **plug-ins of CMSes are hard to compose** With a CMSs you
can, through plug-ins, easily incorporate full-stack behavior to your
app. If plug-ins don't
need to talk to each other you can quickly build an app,
but 
gettting different
plugins to work together to achieve a greater purpose
can be a lot of work that often requires
writing advanced server-side code.

- **low-code platforms still require you to write
most of the end-user behavior** Low-code platforms
offer a visual interface and domain-specific languages to
specify a schema, queries, updates and views. While they
allow for custom behavior to be specified, 
you still need to
write most of the code for the application logic---albeit
at a much higher-level than with general-purpose
languages and tools.

## use case

Re#'s sweet spot is limited-variability apps.
A limited-variability app is an amalgamation of common
functionality, with only small variations between the app and other apps
in its category. (Hence the name of our tool! using re# you
are, for the most part, rehashing concepts.)

For example, if you want to build a social news aggregator,
you'd most likely want functionality that allows users to submit news and rate
or comment on submitted stories. Perhaps your app has some variations
from other social news apps. For example, instead of upvoting/downvoting
you'd like users to give a 5-star rating to submitted news. Or you want
the posters to geolocate submissions. But, for the
most part, your app could be built by configuring and
combining a set of pre-built concepts
(like rating and commenting).

If you are building such an app, re# would be faster than the alternatives
(see why section above) and because apps can be written with HTML/CSS,
we hope re# will enable more people to build limited-variability apps.

