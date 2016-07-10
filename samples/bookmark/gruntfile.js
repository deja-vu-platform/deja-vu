module.exports = function(grunt) {
  require("mean-loader").GruntTask.task(grunt,
     "dv-samples-bookmark",  // name
     ["Home", "Landing", "Bookmark", "CreatePost", "Post", "User"], // widgets
     ["Post", "User"],  // attachments
     "",  // main
     {
       "dv-access-auth": 1,
       "dv-community-follow": 2,
       "dv-messaging-post": 1,
       "dv-messaging-feed": 1,
       "dv-organization-label": 1,
     });
}
