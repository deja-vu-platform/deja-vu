module.exports = function(grunt) {
  require("grunt-dv-mean")(grunt, {
    "dv-access-auth": 1,
    "dv-community-follow": 2,
    "dv-messaging-post": 1,
    "dv-messaging-feed": 1,
  });
}
