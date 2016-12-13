/// <reference path="../typings/tsd.d.ts" />
import {Mean} from "mean-loader";
import {ServerBus} from "server-bus";


const mean = new Mean();
const bus = new ServerBus(
    mean.fqelement,  mean.ws, {user: {create: undefined, update: undefined}},
    mean.comp, mean.locs);

mean.start();


console.log("Initializing DB");

bus.create_atom("Member", "0", {name: "Alyssa"});
bus.create_atom("Member", "1", {name: "Ben"});
