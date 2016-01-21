/// <reference path="typings/tsd.d.ts" />
import * as express from "express";
import * as bodyParser from "body-parser";
import morgan = require("morgan");
import {Collection} from "mongodb";
import bcrypt = require("bcryptjs");

import {db} from "./db";


const app = express();

app.use(morgan("dev"));
app.use(express.static(__dirname));

const jsonParser = bodyParser.json();

app.post(
  "/signin",
  jsonParser,
  (req, res, next) => {
    console.log(req.body);
    username = req.body.username;
    password = req.body.password;
    db.collection("users").findOne({username: username}, (err, user) => {
      if (err) return next(err);
      if (!user) {
        return next("Incorrect username");
      }
      bcrypt.compare(user.password, password, (err, res) => {
        if (err) return next(err);
        if (!res) {
          return next("Incorrect password");
        }
        console.log("sign in successful");
      });
    });
  });


app.post(
  "/register",
  jsonParser,
  (req, res, next) => {
    console.log(req.body);
  });

app.listen(3000, () => {
  console.log(`Listening on port 3000 in mode ${app.settings.env}`);
});
