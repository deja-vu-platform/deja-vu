# Tutorial: Building a Hacker News clone

This tutorial covers the fundamentals of Déjà Vu through
a social news aggregation app *SN*, that is a simple
clone of [Hacker News](https://news.ycombinator.com/).
The code of the app can be found in [samples/sn](../samples/sn).

In *SN*, registered users can submit links,
which can then be voted up by other members (posts with
more upvotes appear towards the top of the home page).
Registered users can also comment on a post or comment and upvote comments.

## Including and Configuring Clichés

The process of building a Déjà Vu app begins by navigating the
[catalog of clichés](../packages/catalog/README), to find 
one that has the functionality you are looking for.

Clichés are freestanding, without any mutual dependencies. As a
user of Déjà Vu, you can ignore
the (front-end and back-end) code that implements the cliché. The only
aspects of a cliché you'll interact with are the configuration options and exported actions. The
documentation accompanying a cliché includes information about the configuration options
(e.g., their effect on behavior) and the exported actions.

Cliché actions are interactive user interface elements that can read and
write back-end data.
They can
also have inputs and produce outputs.

*SN* uses the [Authentication](../packages/catalog/authentication/README)
cliché to handle user authentication,
[Comment](../packages/catalog/comment/README) to comment on both posts and other comments,
[Property](../packages/catalog/property/README) to save a post's author, title, and link, and
[Scoring](../packages/catalog/scoring/README) twice: once for keeping track of each post's upvotes;
and another one for the upvotes of comments.

The app's config file (dvconfig.json) is shown below:
```json
{
  "name": "sn",
  "type": "app",
  "usedCliches": {
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
      "name": "scoring",
      "config": { "oneToOneScoring": true }
    },
    "scoringcomments": {
      "config": { "oneToOneScoring": true }
    }
  },
  "routes": [
    { "path": "item", "action": "show-post-details" },
    { "path": "login", "action": "login" },
    { "path": "news", "action": "home" },
    { "path": "submit", "action": "submit-post" },
    { "path": "", "action": "home" }
  ]
}
```

The config file specifies the clichés used by the app. This is also
where other information, such as the name of the app and routes are specified.
The value of `usedCliches` determines what clichés are included in the application.
This object has one key-value pair per cliché instance. The key (e.g., `property`)
determines the name (or alias) that is going to be used in the HTML to refer to that instance.
The value provides information about the instance, such as the name of the cliché
(e.g., `scoring` in `scoringposts`) and its configuration options. (If no cliché
name is given, the cliché of same name as the given alias will be used.)

*Property* accepts a configuration variable (`schema`) that expects a [JSON 
Schema](http://json-schema.org/) to describe the properties of the objects it will be 
saving.
(The *Property* cliché essentially gives you a data modeling
defining facility, albeit with simple CRUD behavior.)

In *SN*, we use `schema` to configure the type of properties we expect our
objects (the posts) to have (an author, a title, and a url). The effect of this is that when we
use an action from *Property* to, for example, create an object, the action will allow
the user to input those fields---author, title, and url.
Moreover, since we specified they are all required fields, the action
will expect the user to provide a value for each one (and show an
error if she doesn't).

In the app's configuration file, we also define the routes of
our app, given as
a list of path and action name pairs.
Each page is an app action, and app actions---as we'll see later---can contain other actions.
Our homepage
is the action `home` because `path` is empty.
If the user navigates to `/login`, the `login` action
will be shown; if she navigates to `/item`, the `show-post-details`
action will be shown.

## Linking Actions

There are two types of actions: *cliché actions* and
*app actions*. Cliché actions
are the actions defined by clichés; app actions
are the actions that are part of the app being developed.

Each app
action is written in a separate HTML file.
App actions can contain other actions, which can be
of either kind (cliché actions or app actions).
Actions are included as if they were HTML
elements, with the tag given by `cliche.action-name` or
`app.action-name`.

Below is a code excerpt of *SN*'s `submit-post`:
```html
<dv.action name="submit-post">
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
</dv.action>
```


`submit-post` includes one app action, `navbar`; three cliché actions,
`authenticate` of `authentication`, `create-object` of
`property`, and
`create-score` of the `scoringposts` instance of *Scoring*; 
and three built-in actions (which can be regarded as free-standing cliché actions): `dv.if`, which
shows the enclosed content if the given condition is true, `dv.gen-id`,
which generates a unique ID, `dv.link` which navigates to the action matching
the `/item` route (and uses `dv.gen-id.id` for its `id` input), and `dv.tx`
which synchronizes the actions it wraps (explained in more detail later).

App actions, like cliché actions, can have input and
output values (which can be used in other app actions).
Inputs to an action are bound with the syntax `parameter=value`.
The value could
be a literal or an output from some other action on the page.
Actions can be fired repeatedly, and the output variables
hold the values from the last execution.

Some action inputs are for customizing
appearance and have no impact on the behavior of the action.
For example, as a result of setting
`buttonLabel` to `"Submit"`,
`create-object`'s button will carry the label "Submit" instead of the
default button label "Create Object".

## Action Synchronization

Cliché actions have two phases: an *evaluation* phase (eval) and an
*execution* phase (exec). App actions don't have phases.

Both phases can take inputs and produce outputs.
When a cliché action execs or evals, it expects all its
required inputs
to be available---blocking the evaluation or
execution until inputs are given.
After the phase runs, it will produce its outputs.

What happens
on eval or exec is up to the author of the cliché, but
by convention the evaluation phase fetches data from the server (e.g., loading scores), and
the execution phase produces some side-effect on the server 
(e.g., creating a new score).
The action author determines what triggers the evaluation or
execution of the action. Typically, the loading of
the action itself triggers the evaluation of an action,
and some user interaction
(e.g., a button click or a selection of an item from a dropdown)
triggers its execution.

There are two types of app actions: a regular action and
a transaction (tx) action. A tx action synchronizes
the evaluation and execution of the cliché actions it wraps, so that the
evaluation/execution of one action triggers the evaluation/execution of all the other sibling
actions, and they either complete in their entirety (if all succeeded) or have no effect whatsoever
(if one of them fails).
Instead of putting each action in separate HTML files,
you can wrap elements in another action with the `dv.tx` tag to create an
anonymous tx action with content equal to the content of the tag.
In contrast, a regular action allows any one of its children actions to execute; thus a regular action can
be thought of as an "or" action and a tx action as an "and" action.

The button in the `create-object` action of *Property* causes
the action to execute on click. Thus, if this action is wrapped in a
`dv.tx`, it will trigger the execution of all its sibling cliché actions
when a user clicks on the button.

There is no shared state between clichés, but objects in
different clichés may be associated by sharing ids. 
In `submit-post`, for example,  the same uniquely generated id is passed
to `create-score` and `create-object`. As a result, 
when a user clicks on the "Submit" button of `create-object`,
`create-score` will create a score
with the same id as the object `create-object` will create. These two objects can be
thought of as views of the same *SN* post.

Similarly, in *SN*'s `show-post` action, we feed
the `id` input (inputs are preceded with `$`) to `show-object` and
`show-target`:

```html
<dv.action name="show-post" loadedPost$=property.show-object.loadedObject>
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
</dv.action>
```

Each of these actions loads and displays its own
view of the post entity; the effect when put together is to display a
*SN* post object. The configuration parameters of an action allow its effect,
including its appearance, to be customized; thus the hidden parameter of
`show-object` marks it as a hidden HTML element, so that it does not appear
(even though the object data itself is still loaded, emitted as an output,
and used in several parts of the view). (Any action can be hidden with `hidden=true`,
but the action still runs as if it wasn't hidden, the only difference
is that it won't be shown to the user---and as a result, the user won't be able
to interact with it.) All `show-*` actions of clichés follow
this pattern: when loaded, the action evaluates and if an id was given
it fetches the entity (e.g., the object, score) with the given id
from its database and emits it as output.}
