module.exports = function(grunt) {
  require("grunt-dv-mean")(grunt, [
    "dv-access-auth",
    "dv-community-follow",
    "dv-messaging-post",
    "dv-messaging-feed"
  ]);
}
