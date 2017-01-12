module.exports = function(grunt) {
  require("mean-loader").GruntTask.task(grunt,
     "dv-samples-morg",  // name
     [
       {name: "Home", path: "home"},
       {name: "GroupMeeting"}
     ], // widgets,
     "Home",  // main
     { // cliches
       "dv-organization-event": 1,
       "dv-organization-allocator": 1,
       "dv-messaging-email": 1
     },
     [ // used widgets
       {name: "NewWeeklyEvent", fqelement: "dv-organization-event"},
       {name: "WeeklyEvent", fqelement: "dv-organization-event"},
       {name: "Event", fqelement: "dv-organization-event"},
       {name: "Consumer", fqelement: "dv-organization-allocator"},
       {name: "SendEmail", fqelement: "dv-messaging-email"}
     ]);
}
