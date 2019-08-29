---
---

# tutorial: building apps with re#
{:.no_toc}

This tutorial covers the fundamentals of Déjà Vu through
a social news aggregation app *SN*, that is a simple
clone of [Hacker News](https://news.ycombinator.com/).
In *SN*, users can submit links,
which can then be voted up by other members.
Users can also comment on a post or comment and upvote comments.
The code of the app can be found in [samples/sn](../samples/sn).

## Contents
{:.no_toc}

- This is replaced
{:toc}

## Including and Configuring Concepts

### Choosing Concepts

The process of building a Déjà Vu app begins by navigating the
[catalog of concepts](../packages/catalog/README) to find 
the concepts that provide the functionality you need for your app.
The
documentation accompanying a concept includes information about the configuration options
(e.g., their effect on behavior) and the exported components.
Concept components control a patch of the screen, are
interactive, and can read and write back-end data.
They
also have input and output properties.

*SN* uses the [Authentication](../packages/catalog/authentication/README.md)
concept to handle user authentication,
[Comment](../packages/catalog/comment/README.md) to comment on posts and reply to comments,
and [Scoring](../packages/catalog/scoring/README.md) twice:
for keeping track of upvotes on both posts and on comments separately.
It also uses [Property](../packages/catalog/property/README.md) to save a post's author, title, and link---the Property concept gives you
a data-model-defining facility for simple CRUD behavior.


### Including Concepts

The concepts used by the app are specified in
the app's JSON config file (dvconfig.json). An excerpt of
[*SN*'s config file](../samples/sn/dvconfig.json) is shown below:

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

The `usedConcepts` object has one key-value pair per concept instance. The key
(e.g., `post` on line 6)
determines the name that is going to be used in the HTML to refer to that instance.
The value is another object with two
optional
key-value pairs: `concept` for providing the name of the concept to
be
instantiated (e.g., `property` on line 7), and
`config` for specifying the configuring options
for the concept instance (e.g., the object in lines
8-18).
If no concept name is provided, the concept instantiated is
the one with name equal to the
instance name. Thus, on line 4,
the concept to be instantiated for `authentication`
is Authentication.
If no
configuration object is given, the default configuration
for that concept is used.
The format of the values of configuration options
is also JSON.

### Configuring Concepts

In *SN*, we only have to configure Property.
Property accepts a configuration variable (`schema`) that expects a
[JSON Schema](http://json-schema.org/) to describe the objects it will be
saving.
We use `schema` to specify the type of properties we expect our
objects (the posts) to have (an author, a title, and a url). The effect of this is that when we
include a component from Property,
such as `create-object`,
the component will allow
the user to input only those fields---author, title, and url.
Moreover, since we specified that
that the format of the
url field is `url` (line 14) and that
all fields (author, title, and url) are
required (line 16), `create-object`
will expect the user to provide a value for each
one and check that the value given for
the url field is
a valid URL. If the user
doesn't provide a value for each field or
the value for url is invalid, `create-object` will show an
error message.

### Routes

In the app's config file, we also define the
name (line 2) and
routes (lines 23-27) of our app.
Each route
maps a URL path to a component.
Any app component can be a page (i.e., accessible
via a URL).
*SN*'s homepage
is the component `home` (line 24) because `path` is empty.
If the user navigates to "/login", the `login`
component
will be shown (line 25) and if they navigate to "/item", the
`show-post-details`
component will be shown (line 26).

## Linking Components

Each app
component is written in a separate HTML file.
Excerpts
of the code for [*SN*'s `submit-post`]()
and [`show-post`]() components, together with a
screenshot
of how they appear to users, are shown below:

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

Our template language looks, by design,
similar to other template languages. To create an app
component, users include
components and
synchronize them to implement
the desired functionality.

### Including Components

App components can contain other components, which can be
concept components (i.e., components defined by concepts) or app components (i.e., components that
are defined as part of the app being developed).
Components are included as if they were HTML
elements, with the tag given by the
concept instance or app name,
followed by the component name.
Thus, `submit-post` includes one app component,
`navbar` (line 2); two concept components, `create-object` of the
`post` instance of *Property*
(lines 5-8), and
`create-score` of the `scoreposts` instance of
*Scoring* (lines 9-10);
and one built-in component,
`dv.gen-id` (line 4),
which generates a unique ID
(built-in components
can be regarded as free-standing concept components).

#### I/O Binding

Inputs to a component are bound with the syntax `property=expr`.
Template expressions can include
literal values, app component inputs,
outputs from other components
on the page, and
standard
operators. The
syntax of template expressions is
similar to that of JavaScript expressions,
but no function calls, or JavaScript
operators
that produce side-effects are allowed.

Components can be fired repeatedly, and the output variables
hold the values from the last execution. This is how a selector widget such as a dropdown would typically be connected to another component: the dropdown sets an output property every time it is activated containing the choice the user made, which is then bound to the input variable of components that use that choice.

Some inputs are for customizing
appearance and have no impact on the behavior of the component.
For example, as a result of setting
`buttonLabel` to `"Submit"` on line 7 of `submit-post`,
`create-object`'s button will carry the label "Submit" instead of the
default button label "Create Post".
The `hidden` parameter of `show-object` in `show-post` marks `show-object`
as hidden.
Hidden components are not shown to the user, but still run
as if they were visible. Thus
the object data itself is still loaded, emitted as
an output, and used in several parts of the view---the title
and the link are used and shown through lines 5-6, while
the author is displayed on line 11.

App component inputs are preceded with `\$`. For example, `show-post`
has an input named `id` that it uses in lines 2, 4, 9, and 12.
Based on this input, `how-object` will show the post whose ID matches the given one;
`upvote` will use the ID as the target of the score if one is created;
`show-target` will show the score with the given ID;
and clicking on the "comments" link will take
the user to `show-post-details` with its
input `id`
set to the given ID.

#### ID Sharing

To bind entities in different concepts we use a common identifier.
In `submit-post`, for example,
the same ID, generated by `gen-id` (line 4), is passed
to `create-object` (line 5) and `create-score` (line 9). As a result,
`create-score` will create a score
with the same target ID as the object `create-object` will create.
Similarly, in `show-post`, we feed
the `id` input
to `show-object` (line 2) and
`show-target` (line 9). Each of these components loads and
displays its own
view of the post entity; the effect when put together is to
display a *SN* post object.

### Synchronizing Components

#### Action Types

Concept components have two actions: an
*evaluation* action (eval) and an
*execution* action
(exec). 
The concept author determines what triggers the evaluation or
execution of the component. Typically, the loading of
the component itself triggers the evaluation of a component,
and some user interaction
(e.g., a button click)
triggers its execution.
What happens
on eval or exec is also up to the author of the concept---the only
restriction is that an
eval action cannot produce
a side effect. 
App components don't have actions.
This is because
app components have no
back-end functionality of their own---all
data and behavior is pushed
to concepts.

Eval/exec actions support the conventional
user interaction pattern of web apps:
data is loaded and displayed, and then
the user executes commands to mutate the
data.
But perhaps concept components could offer
arbitrary action types.
This would require more work from the user (who
would now have to specify what action types are to be
coordinated), but
could allow more complicated applications to
be built, without requiring the modification
or creation of a concept.


#### Synchronizing Actions

There are two kinds of app component: a regular component and
a transaction (tx) component.
A regular component
allows any of its children
components to eval/exec without
synchronization.
A tx component, on the other
hand, synchronizes
the eval/exec of the concept components it wraps.
As a result, the eval (or exec) of one concept
component triggers the eval (or exec) of all its
sibling concept components and they either
complete in their entirety (if all succeeded) or
have no effect whatsoever other than displaying an error
message to the user (if one or more aborts).
Instead of putting each component in separate HTML files,
you can wrap elements in another component with the `dv.tx` tag to create an
anonymous tx component with content equal to the content of the tag.

In *SN*'s `submit-post`,
the tx is triggered by
`create-object` (line 5)
when the user clicks on the button.
This is because
the button in the `create-object` component of *Property* causes
the component to execute on click,
and
since `create-object`
is wrapped in a `dv.tx`, it will trigger the execution of all its sibling concept components. As a result,
a new post and a new score will be created, bound by
the shared id (the target id of the score is the post id).
