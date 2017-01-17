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
       {name: "FeedItem"},
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
       {name: "Feed", fqelement: "dv-messaging-feed"},
       // App
       {name: "SignOut", fqelement: "dv-access-auth"},
       // Create Post
       {name: "NewPostContent", fqelement: "dv-messaging-post"},
       {name: "LabelsText", fqelement: "dv-organization-label"},
       {name: "NewPostButton", fqelement: "dv-messaging-post"},
       // Feed Item
       {name: "Author", fqelement: "dv-messaging-post"},
       {name: "Labels", fqelement: "dv-organization-label"},
       {name: "CommentsWithComment", fqelement: "dv-messaging-comment"},
       // hack..shouldn't have to specify these
       {name: "NewComment", fqelement: "dv-messaging-comment"},
       {name: "Comments", fqelement: "dv-messaging-comment"},
       {name: "Comment", fqelement: "dv-messaging-comment"},
       // Landing
       {name: "SignIn", fqelement: "dv-access-auth"},
       {name: "Register", fqelement: "dv-access-auth"},
       // Topics and Users
       {name: "LoggedIn", fqelement: "dv-access-auth"},
       {name: "EditFollow", fqelement: "dv-community-follow"}
     ]
     );
}
