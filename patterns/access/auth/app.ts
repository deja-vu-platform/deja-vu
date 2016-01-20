/// <reference path="typings/express/express.d.ts" />
/// <reference path="typings/body-parser/body-parser.d.ts" />
/// <reference path="typings/morgan/morgan.d.ts" />
/// <reference path="typings/mongodb/mongodb.d.ts" />
/// <reference path="typings/passport/passport.d.ts" />
/// <reference path="typings/passport-local/passport-local.d.ts" />
import * as express from "express";
import * as bodyParser from "body-parser";
import morgan = require("morgan");
import {Collection} from "mongodb";
import passport = require("passport");
import {Strategy} from "passport-local";

import {db} from "./db";


const app = express();

app.use(morgan("dev"));
app.use(express.static(__dirname));


function validPassword(user, password) {
  // todo
}

passport.use(new Strategy((username, password, done) => {
  console.log("doing something here");
  db.collection("users").findOne({username: username}, (err, user) => {
    if (err) return done(err);
    if (!user) {
      return done(null, false, {message: "Incorrect username"});
    }
    if (!validPassword(user, password)) {
      return done(null, false, {message: "Incorrect password"});
    }
    return done(null, user);
  });
}));


app.post(
  "/signin",
  passport.authenticate("local", {
    successRedirect: "/", failureRedirect: "/login", failureFlash: true})
);


app.listen(3000, () => {
  console.log(`Listening on port 3000 in mode ${app.settings.env}`);
});
