/// <reference path="typings/express/express.d.ts" />
import * as express from "express";

var friend = express();

friend.use(express.static(__dirname));
friend.listen(3000, () => {
  console.log("Listening on port %d in %s mode", 3000, friend.settings.env);
});
