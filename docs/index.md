---
layout: default
---

# about

Déjà Vu is a **platform for building web apps**. 
It features a catalog of
[full-stack functionality](./catalog)
and an [HTML-like language](./tutorial) for
assembling web apps using the catalog.
With Déjà Vu you can build [complex apps](./samples) fast, without writing any
client- or server-side procedural code.

Déjà Vu implements [a new approach to app development](./research). In this approach,
you build apps by synchronizing, in a declarative fashion, GUI components of
granular, full-stack modules that implement end-user behavior.

- **batteries included** In Déjà Vu, a web app is constructed
by combining concepts.
A concept is a self-contained, reusable,
increment of functionality that is motivated by a purpose defined in terms of
the needs of a user. For example, think of the "comment" functionality
on Facebook or "rating" on Amazon. We have a growing [catalog of
concepts](./catalog) you can use to build your app.

- **assemble with HTML** The assembly requires no traditional
code: concepts are [glued together by declarative bindings](./tutorial)
that ensure appropriate synchronization and dataflow. These
bindings are expressed in an HTML-like 
language, augmenting conventional layout declarations that
determine which user interface widgets from which concepts
are used, and how they are placed on the page. Concepts
are configured in JSON and you can style your app with CSS.

- **conventional output** A compiled Déjà Vu app is a standard MEAN
(MongoDB-Express-Angular-Node.js) app, which can be
deployed using popular cloud providers. We are actively working on guides
and tooling for deploying. In the meantime, you can follow our
[quickstart guide](./quickstart) to create an app and run it locally in
your machine.


**Déjà Vu is a research prototype and you shouldn't rely on it for anything
important at this point**, but we'd love to hear what you think!
You can play around with it and create an
[issue](https://github.com/spderosso/deja-vu/issues)
(or [email me](https://spderosso.github.io)) with your
feedback or questions.
