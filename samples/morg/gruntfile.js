module.exports = function(grunt) {
  require("mean-loader").GruntTask.task(grunt,
     "dv-samples-morg",  // name
     [
       {name: "Home", path: "home"},
       {name: "ShowGroupMeeting"}
     ], // widgets,
     "Home",  // main
     { // cliches
       "dv-organization-event": 1,
       "dv-organization-allocator": 1,
       "dv-messaging-email": 1
     },
     [ // used widgets
       {name: "NewWeeklyEvent", fqelement: "dv-organization-event"},
       {name: "ChooseAndShowWeeklyEvent", fqelement: "dv-organization-event"},
       {name: "ShowEvent", fqelement: "dv-organization-event"},
       {name: "Consumer", fqelement: "dv-organization-allocator"},
       {name: "SendEmail", fqelement: "dv-messaging-email"}
     ]);
}
