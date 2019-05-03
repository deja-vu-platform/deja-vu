Styling Applications with Themes
================================

DV Themes
---------
To make it easier to style common app actions, we have created a collection of
themes that you can import and use in your applications. These style sheets
also provide a guide for styling components in general. For example, to use DV's default styling for navbars, include the following into your app's `styles.css`.
```css
@import "~@deja-vu/themes/dist/css/navbar.css"
```


Third Party CSS Frameworks/ Style Sheets
----------------------------------------
You are more than welcome to use popular CSS frameworks or style sheets
to style your application. In fact, most of our sample applications use
[Angular Material](https://material.angular.io/guide/theming#using-a-pre-built-theme) and
[Bootstrap](https://getbootstrap.com/) by including the following in the
`styles.css` files:
```css
@import "~@angular/material/prebuilt-themes/indigo-pink.css";
@import "~bootstrap/dist/css/bootstrap.min.css";
```

By simply adding/ removing/ updating the import statments in the app style sheet,
users can harness any pre-built UI components and styles.

Other popular CSS Frameworks include:
| Framework | Example Import Statement |
| --------- | ---------------- |
| [Semantic UI](https://semantic-ui.com/) | `@import "~semantic-ui-css/semantic.min.css"` |
| [Foundation](https://foundation.zurb.com/) | `@import "~foundation-sites/dist/css/foundation.min.css"` |
| [Materialize](https://materializecss.com/) | `@import "~materialize-css/dist/css/materialize.min.css"` |
| [UIkit](https://getuikit.com/) |  `@import "~uikit/dist/css/uikit.min.css"` |
| [Pure](https://purecss.io/) | `@import "~purecss/build/pure-min.css"` |
| [Bulma](https://bulma.io/) | `@import "~bulma/css/bulma.min.css"` |
| [Milligram](https://getuikit.com/) | `@import "~milligram/dist/css/milligram.min.css"` |

Note
----
The order of the imports is important as the styles are applied in a top down
manner.
