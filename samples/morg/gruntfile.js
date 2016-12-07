module.exports = function(grunt) {
  require("mean-loader").GruntTask.task(grunt,
     "dv-samples-morg",  // name
     [
       {name: "Home", path: "/home"}
     ], // widgets,
     [],
     "Home",  // main
     {
       "dv-organization-event": 1,
       "dv-organization-allocator": 1,
       "dv-messaging-email": 1
     });
}
