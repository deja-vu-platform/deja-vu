module.exports = function(grunt) {
  require("mean-loader").GruntTask.task(grunt,
     "dv-samples-bookmark",  // name
     [
       {name: "Home"},
       {name: "App", path: "/app/..."},
       {name: "Landing", path: "/landing"},
       {name: "Bookmark"},
       {name: "CreatePost"},
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
     });
}
