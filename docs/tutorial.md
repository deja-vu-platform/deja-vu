---
---

# building apps with re#

This tutorial covers the fundamentals of Déjà Vu through
a social news aggregation app *SN*, that is a simple
clone of [Hacker News](https://news.ycombinator.com/).
The code of the app can be found in [samples/sn](../samples/sn).

In *SN*, registered users can submit links,
which can then be voted up by other members (posts with
more upvotes appear towards the top of the home page).
Registered users can also comment on a post or comment and upvote comments.

## Including and Configuring Concepts

The process of building a Déjà Vu app begins by navigating the
[catalog of concepts](../packages/catalog/README), to find 
one that has the functionality you are looking for.

Concepts are freestanding, without any mutual dependencies. As a
user of Déjà Vu, you can ignore
the (front-end and back-end) code that implements the concept. The only
aspects of a concept you'll interact with are the configuration options and exported components. The
documentation accompanying a concept includes information about the configuration options
(e.g., their effect on behavior) and the exported components.

Concept components are interactive user interface elements that can read and
write back-end data.
They can
also have inputs and produce outputs.

*SN* uses the [Authentication](../packages/catalog/authentication/README.md)
concept to handle user authentication,
[Comment](../packages/catalog/comment/README.md) to comment on both posts and other comments,
[Property](../packages/catalog/property/README.md) to save a post's author, title, and link, and
[Scoring](../packages/catalog/scoring/README.md) twice: once for keeping track of each post's upvotes;
and another one for the upvotes of comments.

The app's config file (dvconfig.json) is shown below:
```json
{
  "name": "sn",
  "usedConcepts": {
    "authentication": {},
    "comment": {},
    "property": {
      "config": {
        "schema": {
          "title": "Post",
          "type": "object",
          "properties": {
            "author": { "type": "string" },
            "title": { "type": "string" },
            "url": {
              "type": "string",
              "format": "url"
            }
          },
          "required": ["author", "title", "url"]
        }
      }
    },
    "scoringposts": {
      "name": "scoring"
    },
    "scoringcomments": {
      "name": "scoring"
    }
  },
  "routes": [
    { "path": "/item", "component": "show-post-details" },
    { "path": "/login", "component": "login" },
    { "path": "/news", "component": "home" },
    { "path": "/submit", "component": "submit-post" },
    { "path": "", "component": "home" }
  ]
}
```

The config file specifies the concepts used by the app. This is also
where other information, such as the name of the app and routes are specified.
The value of `usedConcepts` determines what concepts are included in the application.
This object has one key-value pair per concept instance. The key (e.g., `property`)
determines the name (or alias) that is going to be used in the HTML to refer to that instance.
The value provides information about the instance, such as the name of the concept
(e.g., `scoring` in `scoringposts`) and its configuration options. (If no concept
name is given, the concept of same name as the given alias will be used.)

*Property* accepts a configuration variable (`schema`) that expects a [JSON 
Schema](http://json-schema.org/) to describe the properties of the objects it will be 
saving.
(The *Property* concept essentially gives you a data modeling
defining facility, albeit with simple CRUD behavior.)

In *SN*, we use `schema` to configure the type of properties we expect our
objects (the posts) to have (an author, a title, and a url). The effect of this is that when we
use a component from *Property* to, for example, create an object, the component will allow
the user to input those fields&mdash;author, title, and url.
Moreover, since we specified they are all required fields, the component
will expect the user to provide a value for each one (and show an
error if she doesn't).

In the app's configuration file, we also define the routes of
our app, given as
a list of path and component name pairs.
Each page is an app component, and app components&mdash;as we'll see later&mdash;can contain other components.
Our homepage
is the component `home` because `path` is empty.
If the user navigates to `/login`, the `login` component
will be shown; if she navigates to `/item`, the `show-post-details`
component will be shown.

## Linking Components

There are two types of components: *concept components* and
*app components*. Concept components
are the components defined by concepts; app components
are the components that are part of the app being developed.

Each app
component is written in a separate HTML file.
App components can contain other components, which can be
of either kind (concept components or app components).
Components are included as if they were HTML
elements, with the tag given by `concept.component-name` or
`app.component-name`.

Below is a code excerpt of *SN*'s `submit-post` definition:
```html
<dv.component name="submit-post">
  <sn.navbar /> ...
  <div class="main">
    <div class="container">
      <dv.if condition=sn.navbar.loggedInUser>
        <dv.tx>
          <dv.gen-id />
          <authentication.authenticate
            id=sn.navbar.loggedInUser.id hidden=true />
          <property.create-object
            buttonLabel="Submit"
            id=dv.gen-id.id
            initialValue={ author: sn.navbar.loggedInUser.username }
            newObjectSavedText="Post submitted"
            showExclude=['author']
            showOptionToSubmit=sn.navbar.loggedInUser />
            
          <scoringposts.create-score
            sourceId=sn.navbar.loggedInUser.username
            targetId=dv.gen-id.id
            value=0
            hidden=true />

          <dv.link href="/item" params={ id: dv.gen-id.id } hidden=true />
        </dv.tx>
      </dv.if>
    </div>
  </div>
</dv.component>
```


`submit-post` includes one app component, `navbar`
([defined elsewhere](https://github.com/spderosso/deja-vu/blob/master/samples/sn/src/navbar/navbar.html));
three concept components,
`authenticate` of `authentication`, `create-object` of
`property`, and
`create-score` of the `scoringposts` instance of *Scoring*; 
and three built-in components (which can be regarded as free-standing concept components): `dv.if`, which
shows the enclosed content if the given condition is true, `dv.gen-id`,
which generates a unique ID, `dv.link` which redirects the user to
another page (in this case, it navigates to the component matching
the `/item` route and uses `dv.gen-id.id` for its `id` input), and `dv.tx`
which synchronizes the components it wraps (explained in more detail later).

App components, like concept components, can have input and
output values (which can be used in other app components).
Inputs to a component are bound with the syntax `parameter=value`.
The value could
be a literal or an output from some other component on the page.
Components can be fired repeatedly, and the output variables
hold the values from the last execution.

Some component inputs are for customizing
appearance and have no impact on the behavior of the component.
For example, as a result of setting
`buttonLabel` to `"Submit"`,
`create-object`'s button will carry the label "Submit" instead of the
default button label "Create Object".

## Component Synchronization

Concept components have two phases: an *evaluation* phase (eval) and an
*execution* phase (exec). App components don't have phases.

Both phases can take inputs and produce outputs.
When a concept component execs or evals, it expects all its
required inputs
to be available&mdash;blocking the evaluation or
execution until inputs are given.
After the phase runs, it will produce its outputs.

What happens
on eval or exec is up to the author of the concept, but
by convention the evaluation phase fetches data from the server (e.g., loading scores), and
the execution phase produces some side-effect on the server 
(e.g., creating a new score).
The component author determines what triggers the evaluation or
execution of the component. Typically, the loading of
the component itself triggers the evaluation of a component,
and some user interaction
(e.g., a button click or a selection of an item from a dropdown)
triggers its execution.

There are two types of app components: a regular component and
a transaction (tx) component. A tx component synchronizes
the evaluation and execution of the concept components it wraps, so that the
evaluation/execution of one component triggers the evaluation/execution of all the other sibling
components, and they either complete in their entirety (if all succeeded) or have no effect whatsoever
(if one of them fails).
Instead of putting each component in separate HTML files,
you can wrap elements in another component with the `dv.tx` tag to create an
anonymous tx component with content equal to the content of the tag.
In contrast, a regular component allows any one of its children components to execute; thus a regular component can
be thought of as an "or" component and a tx component as an "and" component.

The button in the `create-object` component of *Property* causes
the component to execute on click. Thus, if this component is wrapped in a
`dv.tx`, it will trigger the execution of all its sibling concept components
when a user clicks on the button.

There is no shared state between concepts, but objects in
different concepts may be associated by sharing ids. 
In `submit-post`, for example,  the same uniquely generated id is passed
to `create-score` and `create-object`. As a result, 
when a user clicks on the "Submit" button of `create-object`,
`create-score` will create a score
with the same id as the object `create-object` will create. These two objects can be
thought of as views of the same *SN* post.

Similarly, in *SN*'s `show-post` component, we feed
the `id` input (inputs are preceded with `$`) to `show-object` and
`show-target`:

```html
<dv.component name="show-post" loadedPost$=property.show-object.loadedObject>
  <div>
    <property.show-object id=$id hidden=true />

    <dv.if condition=!property.show-object.loadedObject>
      Post not found
    </dv.if>

    <dv.if condition=property.show-object.loadedObject class="post-container">
      <div class="inline-block">
        <sn.upvote
          disabled=!$loggedInUser ||
            property.show-object.loadedObject.author === $loggedInUser.username
          id=$id isPost=true loggedInUser=$loggedInUser />
      </div>
      <div class="inline-block">
        <div>
          <span class="post-title">
            <a href=property.show-object.loadedObject.url>
              <property.show-object class="inline-block"
                object=property.show-object.loadedObject
                showOnly=['title'] />
            </a>
          </span>
          <span class="subtext">(<property.show-url class="inline-block"
            showBaseUrlOnly=true
            url=property.show-object.loadedObject.url />)</span>
        </div>
        <div class="subtext">
          <scoringposts.show-target
            class="inline-block"
            id=$id
            showId=false
            showScores=false
            totalLabel="" />
          points by
          <property.show-object class="inline-block"
            object=property.show-object.loadedObject
            showOnly=['author'] /> |
          <dv.link href="/item" params={ id: $id }>comments</dv.link>
        </div>
      </div>
    </dv.if>
  </div>
</dv.component>
```
```

Each of these components loads and displays its own
view of the post entity; the effect when put together is to display a
*SN* post object. The configuration parameters of a component allow its effect,
including its appearance, to be customized; thus the hidden parameter of
`show-object` marks it as a hidden HTML element, so that it does not appear
(even though the object data itself is still loaded, emitted as an output,
and used in several parts of the view). (Any component can be hidden with `hidden=true`,
but the component still runs as if it wasn't hidden, the only difference
is that it won't be shown to the user&mdash;and as a result, the user won't be able
to interact with it.) All `show-*` components of concepts follow
this pattern: when loaded, the component evaluates and if an id was given
it fetches the entity (e.g., the object, score) with the given id
from its database and emits it as output.}
