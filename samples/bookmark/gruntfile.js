module.exports = function(grunt) {
  require("mean-loader").GruntTask.task(grunt,
     "dv-samples-bookmark",  // name
     [
       {name: "Landing", path: "landing"},
       {
         name: "App", path: "app",
         children: [
          {name: "Home", path: "home"},
          {name: "Users", path: "users"},
          {name: "Topics", path: "topics"}
         ]
       },
       {name: "CreatePost"},
       {name: "ShowFeedPost"},
       {name: "Post"},
       {name: "User"}
     ], // widgets
     "Landing",  // main
     {
       "dv-access-auth": 1,
       "dv-community-follow": 2,
       "dv-messaging-post": 1,
       "dv-messaging-feed": 1,
       "dv-messaging-comment": 1,
       "dv-organization-label": 1
     },
     [ // used widgets
       // Home
       {name: "ShowFeed", fqelement: "dv-messaging-feed"},
       // App
       {name: "SignOutWithRedirect", fqelement: "dv-access-auth"},
       // Create Post
       {name: "NewPostContent", fqelement: "dv-messaging-post"},
       {name: "AttachLabels", fqelement: "dv-organization-label"},
       {name: "NewPostButton", fqelement: "dv-messaging-post"},
       // Feed Item
       {name: "ShowAuthor", fqelement: "dv-messaging-post"},
       {name: "ShowLabels", fqelement: "dv-organization-label"},
       {name: "CommentsWithComment", fqelement: "dv-messaging-comment"},
       // hack..shouldn't have to specify these
       {name: "NewComment", fqelement: "dv-messaging-comment"},
       {name: "Comments", fqelement: "dv-messaging-comment"},
       {name: "ShowComment", fqelement: "dv-messaging-comment"},
       // Landing
       {name: "SignInWithRedirect", fqelement: "dv-access-auth"},
       {name: "RegisterWithRedirect", fqelement: "dv-access-auth"},
       // Topics and Users
       {name: "LoggedIn", fqelement: "dv-access-auth"},
       {name: "EditFollow", fqelement: "dv-community-follow"}
     ],
     { // replace map
       "dv-messaging-feed": {
         "ShowFeed": {
           "ShowFeedItem": {
             "replaced_by": {
               "name": "ShowFeedPost",
               "fqelement": "dv-samples-bookmark"
             },
             "map": {
               "post": {
                 "type": { "name": "Post", "fqelement": "dv-samples-bookmark" },
                 "maps_to": "message"
               }
             }
           }
         }
       }
     }
     );
}
